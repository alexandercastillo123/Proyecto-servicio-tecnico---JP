const db = require('./config/database');

async function updateTable() {
    try {
        console.log('Adding service_type column to appointments table...');
        
        // Add service_type column if it doesn't exist
        await db.ejecutar(`
            ALTER TABLE appointments 
            ADD COLUMN IF NOT EXISTS service_type ENUM('local', 'domicilio') DEFAULT 'local' AFTER description
        `);
        
        console.log('✅ Column added successfully or already exists.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating table:', err);
        process.exit(1);
    }
}

updateTable();
