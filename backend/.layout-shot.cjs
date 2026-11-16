const fs = require('fs');
const WebSocket = require('ws');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiZW1haWwiOiJsYXlvdXQtdGVzdEBqeXAubG9jYWwiLCJ1c2VybmFtZSI6ImxheW91dHRlc3QiLCJyb2xlIjoiY2xpZW50IiwiaWF0IjoxNzkzNjM1MDY1LCJleHAiOjE3OTQyMzk4NjV9.5zvc-JkkSPg19aAKhTo7Jo_wfaxvmkAikHhsgOrImtk';
const USER = {
  id: 7,
  userId: 7,
  email: 'layout-test@jyp.local',
  username: 'layouttest',
  role: 'client',
  names: 'Layout',
  surnames: 'Test',
  person_type: 'natural',
  city: 'Lima',
};

const OUT = 'C:/Users/CODECTA2/AppData/Local/Temp/opencode';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
  const target = list.find((t) => t.type === 'page');
  if (!target) throw new Error('No page target');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.once('open', res); ws.once('error', rej); });

  let id = 0;
  const pending = new Map();
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text || 'Eval error');
    return r.result?.value;
  };

  const navigate = async (url, wait = 2600) => {
    await send('Page.navigate', { url });
    await sleep(wait);
  };

  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.data, 'base64'));
    return `${OUT}/${name}.png`;
  };

  await send('Page.enable');
  await send('Runtime.enable');

  // Login (sin sesión) para comprobar que no se alteró.
  await navigate('http://127.0.0.1:5173/login', 2200);
  await evaluate(`localStorage.clear(); document.documentElement.setAttribute('data-theme','dark');`);
  await navigate('http://127.0.0.1:5173/login', 2200);
  await shot('jyp-login-dark');

  // Sesión de cliente de prueba.
  await evaluate(`
    localStorage.setItem('token', ${JSON.stringify(TOKEN)});
    localStorage.setItem('user', ${JSON.stringify(JSON.stringify(USER))});
    localStorage.setItem('jyp_theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
  `);

  const routes = [
    ['/', 'jyp-light-dashboard'],
    ['/appointments', 'jyp-light-appointments'],
    ['/stores', 'jyp-light-stores'],
    ['/notifications', 'jyp-light-notifications'],
    ['/profile', 'jyp-light-profile'],
    ['/legal', 'jyp-light-legal'],
    ['/appointments/schedule', 'jyp-light-schedule'],
    ['/orders', 'jyp-light-orders'],
    ['/technicians', 'jyp-light-technicians'],
  ];

  const results = [];
  for (const [route, name] of routes) {
    await navigate(`http://127.0.0.1:5173${route}`, 3200);
    const diag = await evaluate(`(() => {
      const main = document.querySelector('.app-main');
      const header = document.querySelector('.app-header');
      const body = getComputedStyle(document.body);
      const mainCs = main ? getComputedStyle(main) : null;
      const headerCs = header ? getComputedStyle(header) : null;
      const pick = (el) => ({
        text: (el.textContent || '').trim().slice(0, 42),
        color: getComputedStyle(el).color,
        bg: getComputedStyle(el).backgroundColor,
        cls: String(el.className).slice(0, 160),
      });
      return {
        theme: document.documentElement.getAttribute('data-theme'),
        bodyBg: body.backgroundColor,
        bodyColor: body.color,
        mainBg: mainCs && mainCs.backgroundColor,
        mainColor: mainCs && mainCs.color,
        headerBg: headerCs && headerCs.backgroundColor,
        headerColor: headerCs && headerCs.color,
        pageShells: document.querySelectorAll('.page-shell').length,
        whiteTexts: [...document.querySelectorAll('.app-main .text-white')].slice(0, 6).map(pick),
        darkBgs: [...document.querySelectorAll('.app-main [class*="bg-[#"]')].slice(0, 8).map(pick),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        mainText: main ? main.innerText.replace(/\\s+/g, ' ').slice(0, 220) : null,
      };
    })()`);
    const file = await shot(name);
    results.push({ route, file, diag });
  }

  // Tema oscuro en el dashboard para comprobar que no hay regresión.
  await evaluate(`localStorage.setItem('jyp_theme','dark'); document.documentElement.setAttribute('data-theme','dark');`);
  await navigate('http://127.0.0.1:5173/', 3000);
  await shot('jyp-dark-dashboard');
  const darkDiag = await evaluate(`(() => {
    const main = document.querySelector('.app-main');
    const body = getComputedStyle(document.body);
    return {
      theme: document.documentElement.getAttribute('data-theme'),
      bodyBg: body.backgroundColor,
      mainBg: main && getComputedStyle(main).backgroundColor,
      mainColor: main && getComputedStyle(main).color,
    };
  })()`);

  console.log(JSON.stringify({ results, darkDiag }, null, 2));
  ws.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
