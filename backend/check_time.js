const db = require('./config/database');
async function checkTime() {
    const [dbTime] = await db.pool.query('SELECT NOW() as now');
    console.log('DB Time:', dbTime[0].now);
    console.log('Node Time:', new Date());
    process.exit();
}
checkTime();
