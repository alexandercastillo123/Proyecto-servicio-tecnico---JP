const mysql = require('mysql2/promise');
const Respuesta = require('../utils/Respuesta');
require('dotenv').config();

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

async function listar(query, tables = false, values = []) {
    let respuesta = new Respuesta();
    try {
        const [rows] = await pool.query(query, values);
        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = "exito";
        respuesta.resultado = !tables ? rows[0] : rows;
    } catch (err) {
        console.error('Database Error:', err);
        respuesta.exito = false;
        respuesta.estado = 400;
        respuesta.mensaje = err.sqlMessage || err.message;
        respuesta.resultado = [];
    }
    return respuesta;
}

async function ejecutar(query, values = []) {
    let respuesta = new Respuesta();
    try {
        const [result] = await pool.query(query, values);
        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = "exito";
        respuesta.resultado = result;
    } catch (err) {
        console.error('Database Error:', err);
        respuesta.exito = false;
        respuesta.estado = 400;
        respuesta.mensaje = err.sqlMessage || err.message;
        respuesta.resultado = [];
    }
    return respuesta;
}

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('✅ Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });

module.exports = {
    pool,
    listar,
    ejecutar
};
