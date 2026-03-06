const db = require('../config/database');
const Respuesta = require('../utils/Respuesta');

/**
 * Get all active stores
 */
const getStores = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const dbRes = await db.listar(
            `SELECT * FROM sucursales WHERE status = 'active'`,
            true
        );

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = "Sucursales obtenidas";
        respuesta.resultado = dbRes.resultado || [];
        res.json(respuesta);
    } catch (error) {
        console.error('Get stores error:', error);
        respuesta.mensaje = 'Error al obtener sucursales: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Get stores near a location
 */
const getNearbyStores = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { lat, lng, radius = 10 } = req.query;

        if (!lat || !lng) {
            respuesta.mensaje = 'Se requieren lat y lng';
            return res.status(400).json(respuesta);
        }

        const latF = parseFloat(lat);
        const lngF = parseFloat(lng);
        const radiusF = parseFloat(radius);

        const query = `
            SELECT 
                s.*,
                (
                    6371 * ACOS(
                        GREATEST(-1, LEAST(1,
                            COS(RADIANS(?)) * COS(RADIANS(s.latitude)) *
                            COS(RADIANS(s.longitude) - RADIANS(?)) +
                            SIN(RADIANS(?)) * SIN(RADIANS(s.latitude))
                        ))
                    )
                ) AS distance_km
            FROM sucursales s
            WHERE s.status = 'active'
              AND s.latitude IS NOT NULL
              AND s.longitude IS NOT NULL
            HAVING distance_km <= ?
            ORDER BY distance_km ASC
            LIMIT 50
        `;

        const dbRes = await db.listar(query, true, [latF, lngF, latF, radiusF]);

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'Sucursales cercanas obtenidas';
        respuesta.resultado = dbRes.resultado || [];
        res.json(respuesta);
    } catch (error) {
        console.error('Get nearby stores error:', error);
        respuesta.mensaje = 'Error al obtener sucursales cercanas: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Get store details
 */
const getStoreById = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
        const dbRes = await db.listar(
            'SELECT * FROM sucursales WHERE id = ?',
            false,
            [id]
        );

        if (!dbRes.resultado) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Sucursal no encontrada';
            return res.status(404).json(respuesta);
        }

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.resultado = dbRes.resultado;
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al obtener sucursal: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Get products for a store
 */
const getStoreProducts = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
        const dbRes = await db.listar(
            'SELECT * FROM store_products WHERE sucursal_id = ? ORDER BY created_at DESC',
            true,
            [id]
        );

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.resultado = dbRes.resultado || [];
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al obtener productos: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Add a product to a store
 */
const addStoreProduct = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { sucursal_id, name, description, price, image_url } = req.body;

        if (!sucursal_id || !name || !price) {
            respuesta.mensaje = 'Faltan campos obligatorios';
            return res.status(400).json(respuesta);
        }

        const query = `
            INSERT INTO store_products (sucursal_id, name, description, price, image_url)
            VALUES (?, ?, ?, ?, ?)
        `;

        await db.listar(query, false, [sucursal_id, name, description, price, image_url]);

        respuesta.exito = true;
        respuesta.estado = 201;
        respuesta.mensaje = 'Producto añadido con éxito';
        res.status(201).json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al añadir producto: ' + error.message;
        res.status(500).json(respuesta);
    }
};

module.exports = {
    getStores,
    getNearbyStores,
    getStoreById,
    getStoreProducts,
    addStoreProduct
};
