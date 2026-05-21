const db = require('./backend/config/database');

async function migrate() {
    try {
        console.log('🔄 Iniciando migración para pedidos multi-producto...');

        // 1. Modificar columnas de store_orders para ser NULLABLE (compatibilidad)
        await db.ejecutar(`
            ALTER TABLE store_orders
            MODIFY COLUMN product_id INT NULL,
            MODIFY COLUMN quantity INT NULL,
            MODIFY COLUMN unit_price DECIMAL(10, 2) NULL
        `);
        console.log('✅ store_orders modificado para permitir campos nulos');

        // 2. Crear tabla store_order_products
        await db.ejecutar(`
            CREATE TABLE IF NOT EXISTS store_order_products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                unit_price DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (order_id) REFERENCES store_orders(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES store_products(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('✅ Tabla store_order_products creada exitosamente');

        console.log('\n🎉 Migración completada de forma segura');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error en la migración de pedidos:', err.message);
        process.exit(1);
    }
}

migrate();
