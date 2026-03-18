





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

/**
 * Get store for authenticated user
 */
const getMyStore = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const userId = req.user.id;
        const dbRes = await db.listar(
            'SELECT * FROM sucursales WHERE user_id = ?',
            false,
            [userId]
        );

        if (!dbRes.resultado) {
            respuesta.estado = 404;
            respuesta.mensaje = 'No tienes una sucursal registrada';
            return res.status(404).json(respuesta);
        }

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.resultado = dbRes.resultado;
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al obtener tu sucursal: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Create a new store
 */
const createStore = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const userId = req.user.id;
        const { name, address, city, state, zip_code, country, phone, email, latitude, longitude } = req.body;

        if (!name || !address || !city || !state || !zip_code || !country || !phone || !email) {
            respuesta.mensaje = 'Faltan campos obligatorios';
            return res.status(400).json(respuesta);
        }

        // Check if user already has a store
        const existing = await db.listar('SELECT id FROM sucursales WHERE user_id = ?', false, [userId]);
        if (existing.resultado) {
            respuesta.mensaje = 'Ya tienes una sucursal registrada';
            return res.status(400).json(respuesta);
        }

        const query = `
            INSERT INTO sucursales (user_id, name, address, city, state, zip_code, country, phone, email, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const dbRes = await db.ejecutar(query, [userId, name, address, city, state, zip_code, country, phone, email, latitude, longitude]);

        if (!dbRes.exito) throw new Error('Error al insertar en DB');

        respuesta.exito = true;
        respuesta.estado = 201;
        respuesta.mensaje = 'Sucursal creada con éxito';
        res.status(201).json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al crear sucursal: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Update a store
 */
const updateStore = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { name, address, city, state, zip_code, country, phone, email, latitude, longitude, status } = req.body;

        // Verify ownership
        const store = await db.listar('SELECT id FROM sucursales WHERE id = ? AND user_id = ?', false, [id, userId]);
        if (!store.resultado) {
            respuesta.estado = 403;
            respuesta.mensaje = 'No tienes permiso para editar esta sucursal';
            return res.status(403).json(respuesta);
        }

        const query = `
            UPDATE sucursales SET 
                name = COALESCE(?, name),
                address = COALESCE(?, address),
                city = COALESCE(?, city),
                state = COALESCE(?, state),
                zip_code = COALESCE(?, zip_code),
                country = COALESCE(?, country),
                phone = COALESCE(?, phone),
                email = COALESCE(?, email),
                latitude = COALESCE(?, latitude),
                longitude = COALESCE(?, longitude),
                status = COALESCE(?, status)
            WHERE id = ? AND user_id = ?
        `;

        await db.ejecutar(query, [name, address, city, state, zip_code, country, phone, email, latitude, longitude, status, id, userId]);

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'Sucursal actualizada con éxito';
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al actualizar sucursal: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Delete a store
 */
const deleteStore = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const store = await db.listar('SELECT id FROM sucursales WHERE id = ? AND user_id = ?', false, [id, userId]);
        if (!store.resultado) {
            respuesta.estado = 403;
            respuesta.mensaje = 'No tienes permiso para eliminar esta sucursal o no existe';
            return res.status(403).json(respuesta);
        }

        await db.ejecutar('DELETE FROM sucursales WHERE id = ? AND user_id = ?', [id, userId]);

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'Sucursal eliminada con éxito';
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al eliminar sucursal: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Update a store product
 */
const updateStoreProduct = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params; // Product ID
        const userId = req.user.id;
        const { name, description, price, image_url } = req.body;

        // Verify store ownership through product inner join
        const prod = await db.listar(
            `SELECT p.id FROM store_products p 
            INNER JOIN sucursales s ON p.sucursal_id = s.id 
            WHERE p.id = ? AND s.user_id = ?`,
            false, [id, userId]
        );

        if (!prod.resultado) {
            respuesta.estado = 403;
            respuesta.mensaje = 'Producto no encontrado o no tienes permiso';
            return res.status(403).json(respuesta);
        }

        const query = `
            UPDATE store_products SET 
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                price = COALESCE(?, price),
                image_url = COALESCE(?, image_url)
            WHERE id = ?
        `;

        await db.ejecutar(query, [name, description, price, image_url, id]);

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'Producto actualizado con éxito';
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al actualizar producto: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Delete a store product
 */
const deleteStoreProduct = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params; // Product ID
        const userId = req.user.id;

        const prod = await db.listar(
            `SELECT p.id FROM store_products p 
            INNER JOIN sucursales s ON p.sucursal_id = s.id 
            WHERE p.id = ? AND s.user_id = ?`,
            false, [id, userId]
        );

        if (!prod.resultado) {
            respuesta.estado = 403;
            respuesta.mensaje = 'Producto no encontrado o no tienes permiso';
            return res.status(403).json(respuesta);
        }

        await db.ejecutar('DELETE FROM store_products WHERE id = ?', [id]);

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'Producto eliminado con éxito';
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al eliminar producto: ' + error.message;
        res.status(500).json(respuesta);
    }
};

module.exports = {
    getStores,
    getNearbyStores,
    getStoreById,
    getStoreProducts,
    addStoreProduct,
    getMyStore,
    createStore,
    updateStore,
    deleteStore,
    updateStoreProduct,
    deleteStoreProduct
};
