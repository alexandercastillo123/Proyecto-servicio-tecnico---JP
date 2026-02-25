const db = require('../config/database');

async function setupTable() {
    console.log('⏳ Creating password_resets table...');

    const query = `
        CREATE TABLE IF NOT EXISTS password_resets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(191) NOT NULL,
            code VARCHAR(6) NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX (email),
            INDEX (code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    try {
        const res = await db.ejecutar(query);
        if (res.exito) {
            console.log('✅ Table password_resets created successfully or already exists.');
        } else {
            console.error('❌ Error creating table:', res.mensaje);
        }
    } catch (err) {
        console.error('❌ Exception:', err);
    } finally {
        process.exit();
    }
}

setupTable();
