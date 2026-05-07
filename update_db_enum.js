const db = require('./backend/config/database');

async function update() {
    try {
        await db.ejecutar(`
            ALTER TABLE chat_messages 
            MODIFY COLUMN message_type ENUM('text', 'offer', 'appointment', 'order', 'appointment_progress') 
            DEFAULT 'text'
        `);
        console.log('✅ Base de datos actualizada: message_type ENUM ampliado.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error actualizando DB:', err);
        process.exit(1);
    }
}

update();
