const { pool } = require('../config/database');

async function run() {
  try {
    const [colsSuc] = await pool.query("SHOW COLUMNS FROM sucursales LIKE 'catalog_enabled'");
    if (colsSuc.length === 0) {
      await pool.query("ALTER TABLE sucursales ADD COLUMN catalog_enabled BOOLEAN DEFAULT TRUE AFTER website_url");
      console.log('✅ Added catalog_enabled to sucursales');
    } else {
      console.log('ℹ️ catalog_enabled already exists in sucursales');
    }

    const [colsMsgStatus] = await pool.query("SHOW COLUMNS FROM chat_messages LIKE 'offer_payment_status'");
    if (colsMsgStatus.length === 0) {
      await pool.query("ALTER TABLE chat_messages ADD COLUMN offer_payment_status ENUM('pending', 'waiting_confirmation', 'paid') DEFAULT 'pending' AFTER offer_status");
      console.log('✅ Added offer_payment_status to chat_messages');
    } else {
      console.log('ℹ️ offer_payment_status already exists in chat_messages');
    }

    const [colsMsgMethod] = await pool.query("SHOW COLUMNS FROM chat_messages LIKE 'offer_payment_method'");
    if (colsMsgMethod.length === 0) {
      await pool.query("ALTER TABLE chat_messages ADD COLUMN offer_payment_method VARCHAR(50) DEFAULT NULL AFTER offer_payment_status");
      console.log('✅ Added offer_payment_method to chat_messages');
    } else {
      console.log('ℹ️ offer_payment_method already exists in chat_messages');
    }
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    process.exit(0);
  }
}

run();

