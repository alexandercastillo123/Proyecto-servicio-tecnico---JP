/**
 * jest.config.js
 * Configuración de Jest para tests de integración con MySQL.
 *
 * - Carga .env.test (NO toca la BD de desarrollo).
 * - Ejecuta globalSetup que crea la BD de pruebas y aplica el schema una sola vez.
 * - Ejecuta globalTeardown que cierra el pool de conexiones.
 * - setupFilesAfterEach (via beforeEach en suites) trunca las tablas.
 */
require('dotenv').config({ path: '.env.test' });

module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/test/**/*.test.js'],
    testTimeout: 30000,
    verbose: true,
    forceExit: true,
    detectOpenHandles: true,

    globalSetup: require.resolve('./test/setup/global-setup.js'),
    globalTeardown: require.resolve('./test/setup/global-teardown.js'),
};