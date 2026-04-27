const db = require('./config/database');

async function checkColumns() {
    try {
        const [rows] = await db.pool.query('DESCRIBE appointments');
        console.log('Columns in appointments:');
        rows.forEach(row => console.log(`- ${row.Field}`));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkColumns();
