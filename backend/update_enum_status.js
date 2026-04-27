const db = require('./config/database');

async function updateEnum() {
    try {
        console.log('Updating appointments status ENUM...');
        
        await db.ejecutar(`
            ALTER TABLE appointments 
            MODIFY COLUMN status ENUM('pending','confirmed','completed','cancelled','cancellation_pending','expired','arrived','in_progress') 
            DEFAULT 'pending'
        `);
        
        console.log('✅ ENUM updated successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating ENUM:', err);
        process.exit(1);
    }
}

updateEnum();
