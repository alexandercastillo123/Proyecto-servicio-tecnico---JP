const db = require('./backend/config/database');

async function migrate() {
    try {
        console.log('🔄 Iniciando migración de base de datos para multi-producto...');

        // 1. Modificar columnas product_id, quantity, unit_price para permitir NULL en store_orders
        await db.ejecutar(`
            ALTER TABLE store_orders
            MODIFY COLUMN product_id INT NULL,
            MODIFY COLUMN quantity INT NULL DEFAULT NULL,
            MODIFY COLUMN unit_price DECIMAL(10, 2) NULL DEFAULT NULL
        `);
        console.log('✅ store_orders actualizado (columnas de producto ahora opcionales)');

        // 2. Crear tabla store_order_products para la relación de muchos a muchos
        await db.ejecutar(`
            CREATE TABLE IF NOT EXISTS store_order_products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                unit_price DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (order_id) REFERENCES store_orders(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES store_products(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabla store_order_products creada exitosamente');

        console.log('\n🎉 Migración multi-producto completada con éxito');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error en migración multi-producto:', err.message);
        process.exit(1);
    }
}

migrate();
