const db = require('./config/database');
async function checkResets() {
    const [resets] = await db.pool.query('SELECT * FROM password_resets ORDER BY created_at DESC LIMIT 5');
    console.log('Last 5 resets:', resets);
    process.exit();
}
checkResets();
