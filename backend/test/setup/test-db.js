/**
 * test-db.js
 * Helper para inicializar y limpiar la BD de pruebas (servicio_tecnico_test).
 * Se ejecuta una vez por suite (globalSetup) y limpia tablas antes de cada test.
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// __dirname = backend/test/setup; subimos 2 niveles para llegar a la raíz del repo.
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
// Usa schema.mariadb.sql si existe (compatible con MariaDB 10.4),
// si no, usa el schema.sql original.
const mariadbSchema = path.join(REPO_ROOT, 'base_de_datos', 'schema.mariadb.sql');
const SCHEMA_PATH = fs.existsSync(mariadbSchema)
    ? mariadbSchema
    : path.join(REPO_ROOT, 'base_de_datos', 'schema.sql');

function getAdminConfig() {
    return {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: Number(process.env.DB_PORT) || 3306,
        multipleStatements: true,
    };
}

function getPoolConfig(dbName) {
    return {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: Number(process.env.DB_PORT) || 3306,
        database: dbName,
        multipleStatements: false,
    };
}

async function createDatabaseIfNotExists(dbName) {
    const admin = await mysql.createConnection(getAdminConfig());
    try {
        await admin.query(
            `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
    } finally {
        await admin.end();
    }
}

async function dropAndRecreateDatabase(dbName) {
    const admin = await mysql.createConnection(getAdminConfig());
    try {
        await admin.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
        await admin.query(
            `CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
    } finally {
        await admin.end();
    }
}

async function applySchema(dbName) {
    let sql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    // Elimina líneas que apuntan a otra BD (DROP DATABASE/CREATE DATABASE/USE).
    // Trabajamos contra la BD ya seleccionada por la conexión.
    sql = sql
        .split('\n')
        .filter((line) => !/^\s*(DROP\s+DATABASE|CREATE\s+DATABASE|USE\s+)/i.test(line))
        .join('\n');

    const admin = await mysql.createConnection({ ...getAdminConfig(), database: dbName });
    try {
        await admin.query(sql);
    } finally {
        await admin.end();
    }
}

/**
 * Trunca todas las tablas que toca el user.repository.
 * Orden importa por las FK: primero hijas, luego users.
 */
async function truncateAll(dbName) {
    const conn = await mysql.createConnection(getPoolConfig(dbName));
    try {
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        const tables = [
            'user_device_tokens',
            'password_resets',
            'sucursales',
            'user_profiles',
            'users',
        ];
        for (const t of tables) {
            await conn.query(`TRUNCATE TABLE \`${t}\``);
        }
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    } finally {
        await conn.end();
    }
}

module.exports = {
    createDatabaseIfNotExists,
    dropAndRecreateDatabase,
    applySchema,
    truncateAll,
    getPoolConfig,
    TEST_DB_NAME: process.env.DB_NAME || 'servicio_tecnico_test',
};