





const db = require('../config/database');
const upload = require('../middleware/upload');
const Respuesta = require('../utils/Respuesta');

/**
 * Get all active stores
 */
const getStores = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const dbRes = await db.listar(
            `SELECT * FROM sucursales WHERE status = 'active' ORDER BY created_at DESC`,
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
        const { sucursal_id, name, description, price, image_url, category, brand, sku, is_available } = req.body;
        const userId = req.user.id;

        if (!sucursal_id || !name || !price) {
            respuesta.mensaje = 'Faltan campos obligatorios';
            return res.status(400).json(respuesta);
        }

        // Verify ownership
        const store = await db.listar('SELECT id FROM sucursales WHERE id = ? AND user_id = ?', false, [sucursal_id, userId]);
        if (!store.resultado && req.user.role !== 'admin') {
            respuesta.estado = 403;
            respuesta.mensaje = 'No autorizado para añadir productos a esta sucursal';
            return res.status(403).json(respuesta);
        }

        const query = `
            INSERT INTO store_products (sucursal_id, name, description, price, image_url, category, brand, sku, is_available)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.ejecutar(query, [sucursal_id, name, description, price, image_url, category, brand, sku, is_available ?? true]);

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
 * Get store schedules
 */
const getStoreSchedules = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
        const dbRes = await db.listar(
            'SELECT * FROM store_schedules WHERE sucursal_id = ?',
            true,
            [id]
        );
        respuesta.exito = true;
        respuesta.resultado = dbRes.resultado || [];
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al obtener horarios: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Get store reviews
 */
const getStoreReviews = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
        const dbRes = await db.listar(
            `SELECT sr.*, up.names, up.surnames, up.profile_image_url 
             FROM store_reviews sr
             JOIN user_profiles up ON sr.client_id = up.user_id
             WHERE sr.sucursal_id = ? 
             ORDER BY sr.created_at DESC`,
            true,
            [id]
        );
        respuesta.exito = true;
        respuesta.resultado = dbRes.resultado || [];
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al obtener reseñas: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Add store review
 */
const addStoreReview = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
        const clientId = req.user.id;
        const { rating, comment } = req.body;

        await db.ejecutar(
            'INSERT INTO store_reviews (sucursal_id, client_id, rating, comment) VALUES (?, ?, ?, ?)',
            [id, clientId, rating, comment]
        );

        // Update branch rating/count
        await db.ejecutar(
            `UPDATE sucursales SET 
             rating = (SELECT AVG(rating) FROM store_reviews WHERE sucursal_id = ?),
             reviews_count = (SELECT COUNT(*) FROM store_reviews WHERE sucursal_id = ?)
             WHERE id = ?`,
            [id, id, id]
        );

        respuesta.exito = true;
        respuesta.mensaje = 'Reseña añadida';
        res.status(201).json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al añadir reseña: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Update store status
 */
const updateStoreStatus = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        const store = await db.listar('SELECT id FROM sucursales WHERE id = ? AND user_id = ?', false, [id, userId]);
        if (!store.resultado) {
            respuesta.estado = 403;
            respuesta.mensaje = 'No autorizado';
            return res.status(403).json(respuesta);
        }

        await db.ejecutar('UPDATE sucursales SET status = ? WHERE id = ?', [status, id]);
        respuesta.exito = true;
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al actualizar estado: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Upload Store Image
 */
const uploadStoreImage = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        if (!req.file) {
            respuesta.mensaje = 'No se subió ninguna imagen';
            return res.status(400).json(respuesta);
        }
        const userId = req.user.id;
        const fileUrl = upload.getRelativePath(req.file);

        // Intentar actualizar si ya existe la sucursal, pero no fallar si no existe (creación)
        await db.ejecutar('UPDATE sucursales SET image_url = ? WHERE user_id = ?', [fileUrl, userId]).catch(() => {});

        respuesta.exito = true;
        respuesta.resultado = { url: fileUrl };
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al subir imagen: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Upload Product Image
 */
const uploadProductImage = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        if (!req.file) {
            respuesta.mensaje = 'No se subió ninguna imagen';
            return res.status(400).json(respuesta);
        }
        const fileUrl = upload.getRelativePath(req.file);

        respuesta.exito = true;
        respuesta.resultado = { url: fileUrl };
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al subir imagen: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Create a new store (Used primarily for initial setup/admin)
 */
const createStore = async (req, res) => {
    let respuesta = new Respuesta();
    const connection = await db.pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { 
            name, description, address, city, state, zip_code, country, 
            phone, email, whatsapp, website_url, image_url, latitude, longitude, 
            specialties, opening_time, closing_time, open_days,
            // For admin creation
            admin_email, admin_password 
        } = req.body;

        let targetUserId = req.user.id;
        const role = req.user.role;

        // If admin is creating a store, we must create a new user account for that store
        if (role === 'admin' && admin_email && admin_password) {
            // 1. Check if email already exists
            const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [admin_email]);
            if (existing.length > 0) {
                await connection.rollback();
                respuesta.mensaje = 'El correo del administrador de la sucursal ya está registrado';
                return res.status(400).json(respuesta);
            }

            // 2. Hash password
            const bcrypt = require('bcryptjs');
            const passwordHash = await bcrypt.hash(admin_password, 10);

            // 3. Create user
            const username = name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.floor(Math.random() * 1000);
            const [userResult] = await connection.query(
                'INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, ?)',
                [admin_email, username, passwordHash, 'store']
            );
            targetUserId = userResult.insertId;

            // 4. Create profile
            await connection.query(
                `INSERT INTO user_profiles (user_id, phone, address, city, person_type, names) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [targetUserId, phone, address, city, 'juridical', name]
            );
        } else if (role !== 'admin') {
            // If not admin, verify if user already has a store
            const [existingStore] = await connection.query('SELECT id FROM sucursales WHERE user_id = ?', [targetUserId]);
            if (existingStore.length > 0) {
                await connection.rollback();
                respuesta.mensaje = 'Este usuario ya tiene una sucursal registrada';
                return res.status(400).json(respuesta);
            }
        }

        const query = `
            INSERT INTO sucursales (
                user_id, name, description, address, city, state, zip_code, country, 
                phone, email, whatsapp, website_url, image_url, latitude, longitude, 
                specialties, opening_time, closing_time, open_days
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await connection.query(query, [
            targetUserId, name, description, address, city, state, zip_code, country, 
            phone, email, whatsapp, website_url, image_url, latitude, longitude, 
            specialties, opening_time || '09:00:00', closing_time || '18:00:00', open_days || 'Lunes-Sábado'
        ]);

        await connection.commit();

        respuesta.exito = true;
        respuesta.estado = 201;
        respuesta.mensaje = 'Sucursal y cuenta de acceso creadas con éxito';
        respuesta.resultado = { userId: targetUserId };
        res.status(201).json(respuesta);
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Create store error:', error);
        respuesta.mensaje = 'Error al crear sucursal: ' + error.message;
        res.status(500).json(respuesta);
    } finally {
        if (connection) connection.release();
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
        const fields = req.body;

        // Verify ownership
        const store = await db.listar('SELECT id FROM sucursales WHERE id = ? AND user_id = ?', false, [id, userId]);
        if (!store.resultado) {
            respuesta.estado = 403;
            respuesta.mensaje = 'No autorizado';
            return res.status(403).json(respuesta);
        }

        let query = 'UPDATE sucursales SET ';
        const params = [];
        const updates = [];

        Object.keys(fields).forEach(key => {
            if (key !== 'id' && key !== 'user_id' && key !== 'created_at') {
                updates.push(`${key} = ?`);
                params.push(fields[key]);
            }
        });

        if (updates.length === 0) {
            respuesta.mensaje = 'No hay campos para actualizar';
            return res.status(400).json(respuesta);
        }

        query += updates.join(', ') + ' WHERE id = ? AND user_id = ?';
        params.push(id, userId);

        await db.ejecutar(query, params);

        respuesta.exito = true;
        respuesta.mensaje = 'Sucursal actualizada';
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al actualizar: ' + error.message;
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
        await db.ejecutar('DELETE FROM sucursales WHERE id = ?', [id]);
        respuesta.exito = true;
        respuesta.mensaje = 'Sucursal eliminada';
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
        const { id } = req.params;
        const fields = req.body;
        const userId = req.user.id;

        // Verify ownership through sucursal association
        const productData = await db.listar(
            'SELECT sp.sucursal_id, s.user_id FROM store_products sp JOIN sucursales s ON sp.sucursal_id = s.id WHERE sp.id = ?',
            false,
            [id]
        );

        if (!productData.resultado) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Producto no encontrado';
            return res.status(404).json(respuesta);
        }

        if (productData.resultado.user_id !== userId && req.user.role !== 'admin') {
            respuesta.estado = 403;
            respuesta.mensaje = 'No autorizado para editar este producto';
            return res.status(403).json(respuesta);
        }
        
        let query = 'UPDATE store_products SET ';
        const params = [];
        const updates = [];

        Object.keys(fields).forEach(key => {
            if (key !== 'id' && key !== 'sucursal_id' && key !== 'created_at') {
                updates.push(`${key} = ?`);
                params.push(fields[key]);
            }
        });

        if (updates.length === 0) {
            respuesta.mensaje = 'No hay campos para actualizar';
            return res.status(400).json(respuesta);
        }

        query += updates.join(', ') + ' WHERE id = ?';
        params.push(id);

        await db.ejecutar(query, params);
        respuesta.exito = true;
        respuesta.mensaje = 'Producto actualizado';
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
        const { id } = req.params;
        const userId = req.user.id;

        // Verify ownership
        const productData = await db.listar(
            'SELECT sp.sucursal_id, s.user_id FROM store_products sp JOIN sucursales s ON sp.sucursal_id = s.id WHERE sp.id = ?',
            false,
            [id]
        );

        if (!productData.resultado) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Producto no encontrado';
            return res.status(404).json(respuesta);
        }

        if (productData.resultado.user_id !== userId && req.user.role !== 'admin') {
            respuesta.estado = 403;
            respuesta.mensaje = 'No autorizado para eliminar este producto';
            return res.status(403).json(respuesta);
        }

        await db.ejecutar('DELETE FROM store_products WHERE id = ?', [id]);
        respuesta.exito = true;
        respuesta.mensaje = 'Producto eliminado';
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al eliminar producto: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Crear un nuevo pedido en una sucursal
 */
const createOrder = async (req, res) => {
    let respuesta = new Respuesta();
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();

        const clientId = req.user.id;
        const { product_id, quantity, delivery_address, latitude, longitude } = req.body;

        if (!product_id || !quantity) {
            respuesta.mensaje = 'Faltan campos obligatorios (product_id, cantidad)';
            return res.status(400).json(respuesta);
        }

        // Obtener detalles del producto para el precio y sucursal_id
        const [productRes] = await connection.query(
            'SELECT sucursal_id, name, price FROM store_products WHERE id = ? AND is_available = TRUE',
            [product_id]
        );

        if (!productRes || productRes.length === 0) {
            await connection.rollback();
            respuesta.estado = 404;
            respuesta.mensaje = 'Producto no disponible o no encontrado';
            return res.status(404).json(respuesta);
        }

        const product = productRes[0];
        const { sucursal_id, name: product_name, price: unit_price } = product;
        const total_price = unit_price * quantity;

        // Insertar el pedido
        const queryOrder = `
            INSERT INTO store_orders (client_id, sucursal_id, product_id, quantity, unit_price, total_price, status, delivery_address, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
        `;

        const [orderResult] = await connection.query(queryOrder, [
            clientId, sucursal_id, product_id, quantity, unit_price, total_price, delivery_address, latitude, longitude
        ]);

        const orderId = orderResult.insertId;

        // Obtener el user_id de la sucursal para el mensaje de chat
        const [storeRes] = await connection.query('SELECT user_id FROM sucursales WHERE id = ?', [sucursal_id]);
        
        if (storeRes && storeRes.length > 0) {
            const storeUserId = storeRes[0].user_id;

            // Insertar mensaje automático en el chat tipo 'order'
            const chatMsg = `🛒 *Nuevo Pedido Recibido*
Producto: ${product_name}
Cantidad: ${quantity}
Total: S/ ${total_price.toFixed(2)}
Forma de pago: Coordinar por aquí.`;

            await connection.query(
                'INSERT INTO chat_messages (sender_id, receiver_id, message_text, message_type, order_id) VALUES (?, ?, ?, "order", ?)',
                [clientId, storeUserId, chatMsg, orderId]
            );
        }

        await connection.commit();

        respuesta.exito = true;
        respuesta.estado = 201;
        respuesta.mensaje = 'Pedido realizado con éxito';
        respuesta.resultado = { orderId };
        res.status(201).json(respuesta);

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al crear pedido:', error);
        respuesta.mensaje = 'Error al crear pedido: ' + error.message;
        res.status(500).json(respuesta);
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Get orders for the current client
 */
const getMyOrders = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const clientId = req.user.id;
        const query = `
            SELECT o.*, p.name as product_name, p.image_url as product_image, s.name as store_name
            FROM store_orders o
            JOIN store_products p ON o.product_id = p.id
            JOIN sucursales s ON o.sucursal_id = s.id
            WHERE o.client_id = ?
            ORDER BY o.created_at DESC
        `;
        const dbRes = await db.listar(query, true, [clientId]);
        respuesta.exito = true;
        respuesta.resultado = dbRes.resultado || [];
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al obtener pedidos: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Get orders for a specific store (for owner)
 */
const getStoreOrders = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verify ownership
        const store = await db.listar('SELECT id FROM sucursales WHERE id = ? AND user_id = ?', false, [id, userId]);
        if (!store.resultado && req.user.role !== 'admin') {
            respuesta.estado = 403;
            respuesta.mensaje = 'No autorizado';
            return res.status(403).json(respuesta);
        }

        const query = `
            SELECT o.*, p.name as product_name, up.names as client_names, up.surnames as client_surnames, up.phone as client_phone
            FROM store_orders o
            JOIN store_products p ON o.product_id = p.id
            JOIN user_profiles up ON o.client_id = up.user_id
            WHERE o.sucursal_id = ?
            ORDER BY o.created_at DESC
        `;
        const dbRes = await db.listar(query, true, [id]);
        respuesta.exito = true;
        respuesta.resultado = dbRes.resultado || [];
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al obtener pedidos de la tienda: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Actualizar el estado de un pedido
 */
const updateOrderStatus = async (req, res) => {
    let respuesta = new Respuesta();
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        // Verificar autorización (dueño de sucursal o cliente)
        const [orderRes] = await connection.query(
            `SELECT o.*, s.user_id as store_user_id, p.name as product_name
             FROM store_orders o 
             JOIN sucursales s ON o.sucursal_id = s.id 
             JOIN store_products p ON o.product_id = p.id
             WHERE o.id = ?`,
            [id]
        );

        if (!orderRes || orderRes.length === 0) {
            await connection.rollback();
            respuesta.estado = 404;
            respuesta.mensaje = 'Pedido no encontrado';
            return res.status(404).json(respuesta);
        }

        const order = orderRes[0];
        const isOwner = order.store_user_id === userId;
        const isClient = order.client_id === userId;

        if (!isOwner && !(isClient && (status === 'cancelled' || status === 'delivered')) && req.user.role !== 'admin') {
            await connection.rollback();
            respuesta.estado = 403;
            respuesta.mensaje = 'No autorizado para cambiar el estado de este pedido';
            return res.status(403).json(respuesta);
        }

        // Actualizar el estado
        await connection.query('UPDATE store_orders SET status = ? WHERE id = ?', [status, id]);

        // Notificar por chat sobre el cambio de estado si es relevante
        let msg = '';
        if (status === 'confirmed') msg = `📦 *Pedido Confirmado*: Tu pedido de "${order.product_name}" ha sido aceptado por la tienda.`;
        if (status === 'shipped') msg = `🚚 *Pedido en Camino*: Tu pedido de "${order.product_name}" ya fue enviado.`;
        if (status === 'delivered') msg = `✅ *Pedido Entregado*: El cliente ha marcado el pedido de "${order.product_name}" como entregado. El flujo de pedido ha finalizado.`;

        if (msg) {
            const senderId = isOwner ? order.store_user_id : order.client_id;
            const receiverId = isOwner ? order.client_id : order.store_user_id;

            await connection.query(
                'INSERT INTO chat_messages (sender_id, receiver_id, message_text, message_type, order_id) VALUES (?, ?, ?, "order", ?)',
                [senderId, receiverId, msg, id]
            );
        }

        await connection.commit();
        respuesta.exito = true;
        respuesta.mensaje = 'Estado del pedido actualizado';
        res.json(respuesta);

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al actualizar pedido:', error);
        respuesta.mensaje = 'Error al actualizar pedido: ' + error.message;
        res.status(500).json(respuesta);
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Get appointments linked to a specific store
 */
const getStoreAppointments = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verify ownership or admin
        const store = await db.listar('SELECT id FROM sucursales WHERE id = ? AND user_id = ?', false, [id, userId]);
        if (!store.resultado && req.user.role !== 'admin') {
            respuesta.estado = 403;
            respuesta.mensaje = 'No autorizado';
            return res.status(403).json(respuesta);
        }

        const query = `
            SELECT a.*, 
                up_c.names as client_names, up_c.surnames as client_surnames, up_c.phone as client_phone,
                up_t.names as tech_names, up_t.surnames as tech_surnames
            FROM sucursales_citas sc
            JOIN appointments a ON sc.cita_id = a.id
            JOIN user_profiles up_c ON a.client_id = up_c.user_id
            LEFT JOIN user_profiles up_t ON a.technician_id = up_t.user_id
            WHERE sc.sucursal_id = ?
            ORDER BY a.scheduled_date DESC, a.scheduled_time DESC
        `;
        const dbRes = await db.listar(query, true, [id]);
        respuesta.exito = true;
        respuesta.resultado = dbRes.resultado || [];
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al obtener citas de la sucursal: ' + error.message;
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
    deleteStoreProduct,
    getStoreSchedules,
    getStoreReviews,
    addStoreReview,
    updateStoreStatus,
    uploadStoreImage,
    uploadProductImage,
    createOrder,
    getMyOrders,
    getStoreOrders,
    updateOrderStatus,
    getStoreAppointments
};
