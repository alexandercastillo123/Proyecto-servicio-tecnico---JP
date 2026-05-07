const db = require('./backend/config/database');

async function migrate() {
    try {
        console.log('🔄 Iniciando migración de base de datos...');

        // 1. Añadir campos de pago a store_orders
        await db.ejecutar(`
            ALTER TABLE store_orders
            MODIFY COLUMN status ENUM('pending','paid','confirmed','shipped','delivered','completed','cancelled') DEFAULT 'pending',
            ADD COLUMN IF NOT EXISTS payment_status ENUM('pending','waiting_confirmation','paid') DEFAULT 'pending',
            ADD COLUMN IF NOT EXISTS payment_method ENUM('yape','plin','transfer','cash','culqi') DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS culqi_charge_id VARCHAR(100) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP NULL DEFAULT NULL
        `);
        console.log('✅ store_orders actualizado con campos de pago');

        // 2. Añadir columna culqi_charge_id a appointments (para pagos Culqi en citas)
        await db.ejecutar(`
            ALTER TABLE appointments
            ADD COLUMN IF NOT EXISTS culqi_charge_id VARCHAR(100) DEFAULT NULL,
            MODIFY COLUMN payment_method ENUM('yape','plin','transfer','cash','culqi') DEFAULT NULL
        `);
        console.log('✅ appointments actualizado con soporte Culqi');

        console.log('\n🎉 Migración completada exitosamente');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error en migración:', err.message);
        process.exit(1);
    }
}

migrate();
