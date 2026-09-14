const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * MySQL2 connection pool.
 * All queries should use pool.query() or pool.getConnection() directly.
 * Errors are thrown and caught by asyncHandler → errorHandler.
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'servicio_tecnico_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/**
 * Execute any SQL query with parameters.
 * Returns the result directly; throws on DB error (caught by asyncHandler).
 *
 * @param {string} sql - SQL query string with ? placeholders
 * @param {Array} [params=[]] - Parameters for prepared statement
 * @returns {Promise<Array>} [rows, fields] from mysql2
 */
const query = async (sql, params = []) => {
    return pool.query(sql, params);
};

// Test database connection on startup
pool.getConnection()
    .then(connection => {
        console.log('✅ Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });

module.exports = { pool, query };
