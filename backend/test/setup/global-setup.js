/**
 * global-setup.js
 * Se ejecuta UNA vez antes de toda la suite.
 * Resetea la BD de pruebas y aplica el schema.
 */
const { dropAndRecreateDatabase, applySchema, TEST_DB_NAME } = require('./test-db');

module.exports = async function globalSetup() {
    process.env.DB_NAME = TEST_DB_NAME;
    try {
        console.log(`\n[test] Reseteando BD de pruebas "${TEST_DB_NAME}"...`);
        await dropAndRecreateDatabase(TEST_DB_NAME);
        console.log(`[test] Aplicando schema...`);
        await applySchema(TEST_DB_NAME);
        console.log(`[test] BD lista.`);
    } catch (err) {
        console.warn(`[test] Advertencia: No se pudo conectar a MySQL para globalSetup (${err.message}). Las pruebas unitarias aisladas funcionarán normalmente, pero los tests de integración que requieran MySQL fallarán.`);
    }
};