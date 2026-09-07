/**
 * sucursal.service.js
 * Single Responsibility: Store/branch business logic.
 * Delegates all DB access to sucursal.repository.js
 */
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const sucursalRepo = require('../repository/sucursal.repository');
const userRepo = require('../repository/user.repository');
const notificationService = require('./notification.service');
const AppError = require('../utils/AppError');

// ─── Stores ────────────────────────────────────────────────────────────────────

const getStores = () => sucursalRepo.findAll();

const getNearbyStores = async (lat, lng, radius = 10) => {
    if (!lat || !lng) throw new AppError('Se requieren lat y lng.', 400);
    return sucursalRepo.findNearby(lat, lng, radius);
};

const getStoreById = async (id) => {
    const store = await sucursalRepo.findById(id);
    if (!store) throw new AppError('No logramos encontrar la sucursal solicitada.', 404);
    return store;
};

const getMyStore = async (userId) => {
    const store = await sucursalRepo.findByUserId(userId);
    if (!store) throw new AppError('Aún no cuentas con una sucursal registrada.', 404);
    return store;
};

const createStore = async (requestUser, body) => {
    const { admin_email, admin_password, ...storeData } = body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        let targetUserId = requestUser.id;

        if (requestUser.role === 'admin' && admin_email && admin_password) {
            const emailTaken = await userRepo.emailExists(admin_email);
            if (emailTaken) throw new AppError('El correo del administrador de la sucursal ya está registrado.', 400);

            const passwordHash = await bcrypt.hash(admin_password, 10);
            const slug = storeData.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '_');
            const usernameTaken = await userRepo.usernameExists(slug);
            const finalUsername = usernameTaken ? `${slug}_${Math.floor(100 + Math.random() * 900)}` : slug;

            targetUserId = await userRepo.createBasic(admin_email, finalUsername, passwordHash, 'store', conn);
            await userRepo.createBasicProfile(targetUserId, {
                phone: storeData.phone, address: storeData.address,
                city: storeData.city, personType: 'juridical', names: storeData.name
            }, conn);
        } else if (requestUser.role !== 'admin') {
            const exists = await sucursalRepo.existsByUserId(targetUserId);
            if (exists) throw new AppError('Este usuario ya tiene una sucursal registrada.', 400);
        }

        await sucursalRepo.create({ userId: targetUserId, ...storeData }, conn);
        await conn.commit();
        return { userId: targetUserId };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const updateStore = async (storeId, userId, fields) => {
    const owns = await sucursalRepo.ownsStore(storeId, userId);
    if (!owns) throw new AppError('No autorizado.', 403);
    if (Object.keys(fields).length === 0) throw new AppError('No hay campos para actualizar.', 400);
    await sucursalRepo.update(storeId, userId, fields);
};

const deleteStore = async (storeId) => sucursalRepo.remove(storeId);

const updateStoreStatus = async (storeId, userId, status) => {
    const owns = await sucursalRepo.ownsStore(storeId, userId);
    if (!owns) throw new AppError('No tienes permisos para esta acción.', 403);
    await sucursalRepo.updateStatus(storeId, status);
};

// ─── Products ──────────────────────────────────────────────────────────────────

const getStoreProducts = (storeId) => sucursalRepo.getProducts(storeId);

const addStoreProduct = async (userId, userRole, data) => {
    const { sucursal_id, name, price } = data;
    if (!sucursal_id || !name || !price) throw new AppError('Completa todos los campos obligatorios del producto.', 400);
    const owns = await sucursalRepo.ownsStore(sucursal_id, userId);
    if (!owns && userRole !== 'admin') throw new AppError('No tienes permisos para añadir productos a esta sucursal.', 403);
    await sucursalRepo.insertProduct(data);
};

const updateStoreProduct = async (productId, userId, userRole, fields) => {
    const product = await sucursalRepo.findProductWithStore(productId);
    if (!product) throw new AppError('Producto no encontrado.', 404);
    if (product.user_id !== userId && userRole !== 'admin') throw new AppError('No autorizado para editar este producto.', 403);
    if (Object.keys(fields).length === 0) throw new AppError('No hay campos para actualizar.', 400);
    await sucursalRepo.updateProduct(productId, fields);
};

const deleteStoreProduct = async (productId, userId, userRole) => {
    const product = await sucursalRepo.findProductWithStore(productId);
    if (!product) throw new AppError('Producto no encontrado.', 404);
    if (product.user_id !== userId && userRole !== 'admin') throw new AppError('No autorizado para eliminar este producto.', 403);
    await sucursalRepo.deleteProduct(productId);
};

// ─── Schedules & Reviews ───────────────────────────────────────────────────────

const getStoreSchedules = (storeId) => sucursalRepo.getSchedules(storeId);
const getStoreReviews = (storeId) => sucursalRepo.getReviews(storeId);

const addStoreReview = async (storeId, clientId, rating, comment) => {
    const hasTransaction = await sucursalRepo.hasCompletedTransaction(clientId, storeId);
    if (!hasTransaction) throw new AppError('Solo puedes reseñar después de haber completado una compra o servicio con esta sucursal.', 403);
    const hasReview = await sucursalRepo.hasExistingReview(clientId, storeId);
    if (hasReview) throw new AppError('Ya has calificado a esta sucursal.', 400);
    await sucursalRepo.insertReview(storeId, clientId, rating, comment);
    await sucursalRepo.recalculateRating(storeId);
};

// ─── Orders ────────────────────────────────────────────────────────────────────

const createOrder = async (clientId, { product_id, quantity, products, delivery_address, latitude, longitude }) => {
    let items = [];
    if (products && Array.isArray(products) && products.length > 0) {
        items = products;
    } else if (product_id && quantity) {
        items = [{ product_id, quantity }];
    }
    if (items.length === 0) throw new AppError('Debes seleccionar al menos un producto con cantidad.', 400);

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        let total_price = 0;
        let sucursal_id = null;
        const productsDetail = [];

        for (const item of items) {
            const prod = await sucursalRepo.findProductForOrder(item.product_id, conn);
            if (!prod) throw new AppError('Uno de los productos seleccionados ya no está disponible.', 404);

            if (sucursal_id === null) {
                sucursal_id = prod.sucursal_id;
            } else if (sucursal_id !== prod.sucursal_id) {
                throw new AppError('Todos los productos deben pertenecer a la misma sucursal.', 400);
            }

            const itemQty = parseInt(item.quantity) || 1;
            const itemPrice = parseFloat(prod.price);
            total_price += itemPrice * itemQty;
            productsDetail.push({ product_id: item.product_id, name: prod.name, price: itemPrice, quantity: itemQty });
        }

        const firstItem = productsDetail[0];
        const orderId = await sucursalRepo.insertOrder({
            clientId, sucursalId: sucursal_id,
            productId: firstItem.product_id, quantity: firstItem.quantity,
            unitPrice: firstItem.price, totalPrice: total_price,
            deliveryAddress: delivery_address, latitude, longitude
        }, conn);

        for (const detail of productsDetail) {
            await sucursalRepo.insertOrderProduct(orderId, detail.product_id, detail.quantity, detail.price, conn);
        }

        const storeUserId = await sucursalRepo.findStoreOwner(sucursal_id, conn);
        if (storeUserId) {
            let chatMsg = `🛒 *Nuevo Pedido Recibido*\n`;
            productsDetail.forEach(p => { chatMsg += `• ${p.name} (x${p.quantity}): S/ ${(p.price * p.quantity).toFixed(2)}\n`; });
            chatMsg += `Total: S/ ${total_price.toFixed(2)}\n💳 Por favor, selecciona tu método de pago en la card del pedido.`;
            await sucursalRepo.insertOrderChatMessageConn(conn, clientId, storeUserId, chatMsg, orderId);

            const summaryText = productsDetail.length === 1
                ? `Has recibido un pedido de "${firstItem.name}" (x${firstItem.quantity})`
                : `Has recibido un pedido de ${productsDetail.length} productos`;

            await notificationService.createNotification(
                storeUserId, 'Nuevo Pedido Recibido', summaryText, 'order',
                { orderId: orderId.toString(), productId: firstItem.product_id.toString() }
            );
        }

        await conn.commit();
        return { orderId };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const payOrder = async (orderId, userId, paymentMethod) => {
    const VALID_METHODS = ['yape', 'plin', 'transfer', 'cash'];
    if (!VALID_METHODS.includes(paymentMethod)) throw new AppError('Método de pago inválido.', 400);

    const order = await sucursalRepo.findOrderById(orderId);
    if (!order) throw new AppError('Pedido no encontrado.', 404);
    if (order.client_id !== userId) throw new AppError('Solo el cliente puede pagar este pedido.', 403);
    if (order.payment_status !== 'pending') throw new AppError('Este pedido ya cuenta con un registro de pago en curso o completado.', 400);

    await sucursalRepo.updateOrderPaymentWaiting(orderId, paymentMethod);

    const chatMsg = `💸 *El cliente realizó el pago* de S/ ${parseFloat(order.total_price).toFixed(2)} por "${order.product_name}" vía *${paymentMethod.toUpperCase()}*. Confirma cuando lo recibas.`;
    await sucursalRepo.insertOrderChatMessage(userId, order.store_user_id, chatMsg, orderId);

    await notificationService.createNotification(
        order.store_user_id, 'Pago de Pedido Recibido',
        `El cliente ha notificado el pago por "${order.product_name}"`,
        'order', { orderId: orderId.toString(), action: 'payment_received' }
    );
};

const confirmOrderPayment = async (orderId, userId) => {
    const order = await sucursalRepo.findOrderById(orderId);
    if (!order) throw new AppError('Pedido no encontrado.', 404);
    if (order.store_user_id !== userId) throw new AppError('Solo la tienda puede confirmar el pago.', 403);
    if (order.payment_status !== 'waiting_confirmation') throw new AppError('No hay un pago pendiente de confirmación para este pedido.', 400);

    await sucursalRepo.confirmOrderPayment(orderId);

    const chatMsg = `✅ *¡Pago confirmado!* La tienda confirmó el pago de S/ ${parseFloat(order.total_price).toFixed(2)} por "${order.product_name}". Tu pedido está *confirmado*.`;
    await sucursalRepo.insertOrderChatMessage(userId, order.client_id, chatMsg, orderId);

    await notificationService.createNotification(
        order.client_id, '¡Pago Confirmado!',
        `La tienda ha confirmado tu pago por "${order.product_name}"`,
        'order', { orderId: orderId.toString(), action: 'payment_confirmed' }
    );
};

const getMyOrders = (clientId) => sucursalRepo.findMyOrders(clientId);

const getStoreOrders = async (storeId, userId, userRole) => {
    const owns = await sucursalRepo.ownsStore(storeId, userId);
    if (!owns && userRole !== 'admin') throw new AppError('No autorizado.', 403);
    return sucursalRepo.findStoreOrders(storeId);
};

const updateOrderStatus = async (orderId, userId, userRole, status) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const order = await sucursalRepo.findOrderForStatus(orderId, conn);
        if (!order) throw new AppError('Pedido no encontrado.', 404);

        const isOwner = order.store_user_id === userId;
        const isClient = order.client_id === userId;

        if (!isOwner && !(isClient && ['cancelled', 'delivered'].includes(status)) && userRole !== 'admin') {
            throw new AppError('No autorizado para cambiar el estado de este pedido.', 403);
        }

        await sucursalRepo.updateOrderStatus(orderId, status, conn);

        const MSG_MAP = {
            confirmed: `📦 *Pedido Confirmado*: Tu pedido de "${order.product_name}" ha sido aceptado por la tienda.`,
            shipped:   `🚚 *Pedido en Camino*: Tu pedido de "${order.product_name}" ya está en camino.`,
            delivered: `✅ *Pedido Entregado*: El pedido de "${order.product_name}" ha sido entregado. ¡Gracias!`,
            cancelled: `❌ *Pedido Cancelado*: Tu pedido de "${order.product_name}" ha sido cancelado.`
        };
        const msg = MSG_MAP[status];
        if (msg) {
            const senderId   = isOwner ? order.store_user_id : order.client_id;
            const receiverId = isOwner ? order.client_id     : order.store_user_id;
            await conn.query(
                'INSERT INTO chat_messages (sender_id, receiver_id, message_text, message_type, order_id) VALUES (?, ?, ?, "order", ?)',
                [senderId, receiverId, msg, orderId]
            );
            if (isOwner) await notificationService.notifyOrderStatus(order.client_id, orderId, status, order.product_name);
        }

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

const getStoreAppointments = async (storeId, userId, userRole) => {
    const owns = await sucursalRepo.ownsStore(storeId, userId);
    if (!owns && userRole !== 'admin') throw new AppError('No autorizado.', 403);
    return sucursalRepo.findStoreAppointments(storeId);
};

module.exports = {
    getStores, getNearbyStores, getStoreById, getMyStore, createStore, updateStore, deleteStore, updateStoreStatus,
    getStoreProducts, addStoreProduct, updateStoreProduct, deleteStoreProduct,
    getStoreSchedules, getStoreReviews, addStoreReview,
    createOrder, payOrder, confirmOrderPayment, getMyOrders, getStoreOrders, updateOrderStatus,
    getStoreAppointments
};
