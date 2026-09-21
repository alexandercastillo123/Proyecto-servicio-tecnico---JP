/**
 * global-teardown.js
 * Cierra el pool de mysql2 al terminar TODA la suite.
 */
const { pool } = require('../../config/database');

module.exports = async function globalTeardown() {
    try {
        await pool.end();
    } catch (e) {
        // ignore
    }
};