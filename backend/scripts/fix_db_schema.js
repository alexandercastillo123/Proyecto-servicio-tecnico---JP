const db = require('../config/database');

async function fixSchema() {
    console.log('Start fixing database schema...');
    try {
        console.log('Modifying reviews table to allow NULL appointment_id...');
        await db.ejecutar('ALTER TABLE reviews MODIFY COLUMN appointment_id INT NULL');
        console.log('✅ Successfully modified reviews table.');
    } catch (error) {
        console.error('❌ Error modifying reviews table:', error);
    }
    process.exit();
}

fixSchema();
