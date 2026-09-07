const Respuesta = require('../utils/Respuesta');
const asyncHandler = require('../utils/asyncHandler');
const upload = require('../middleware/upload');
const sucursalService = require('../services/sucursal.service');

// ─── Stores ────────────────────────────────────────────────────────────────────

const getStores = asyncHandler(async (req, res) => {
    const data = await sucursalService.getStores();
    res.json(Respuesta.ok(data, 'Listado de sucursales obtenido con éxito.'));
});

const getNearbyStores = asyncHandler(async (req, res) => {
    const { lat, lng, radius } = req.query;
    const data = await sucursalService.getNearbyStores(lat, lng, radius);
    res.json(Respuesta.ok(data, 'Se han localizado las sucursales más cercanas a tu ubicación.'));
});

const getStoreById = asyncHandler(async (req, res) => {
    const data = await sucursalService.getStoreById(req.params.id);
    res.json(Respuesta.ok(data, 'Éxito'));
});

const getMyStore = asyncHandler(async (req, res) => {
    const data = await sucursalService.getMyStore(req.user.id);
    res.json(Respuesta.ok(data, 'Éxito'));
});

const createStore = asyncHandler(async (req, res) => {
    const data = await sucursalService.createStore(req.user, req.body);
    res.status(201).json(Respuesta.ok(data, '¡La sucursal ha sido configurada correctamente!', 201));
});

const updateStore = asyncHandler(async (req, res) => {
    await sucursalService.updateStore(req.params.id, req.user.id, req.body);
    res.json(Respuesta.ok(null, 'Los datos de la sucursal han sido actualizados correctamente.'));
});

const deleteStore = asyncHandler(async (req, res) => {
    await sucursalService.deleteStore(req.params.id);
    res.json(Respuesta.ok(null, 'La sucursal ha sido retirada de la plataforma correctamente.'));
});

const updateStoreStatus = asyncHandler(async (req, res) => {
    await sucursalService.updateStoreStatus(req.params.id, req.user.id, req.body.status);
    res.json(Respuesta.ok(null, 'El estado de la sucursal se ha actualizado correctamente.'));
});

// ─── Images ────────────────────────────────────────────────────────────────────

const uploadStoreImage = asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json(Respuesta.fail('Por favor, selecciona una imagen válida.'));
    const fileUrl = upload.getRelativePath(req.file);
    await sucursalService.updateStore(req.user.id, req.user.id, { image_url: fileUrl }).catch(() => {});
    res.json(Respuesta.ok({ url: fileUrl }, 'Imagen subida correctamente.'));
});

const uploadProductImage = asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json(Respuesta.fail('Por favor, selecciona una imagen válida.'));
    const fileUrl = upload.getRelativePath(req.file);
    res.json(Respuesta.ok({ url: fileUrl }, 'Imagen de producto subida correctamente.'));
});

// ─── Products ──────────────────────────────────────────────────────────────────

const getStoreProducts = asyncHandler(async (req, res) => {
    const data = await sucursalService.getStoreProducts(req.params.id);
    res.json(Respuesta.ok(data, 'Éxito'));
});

const addStoreProduct = asyncHandler(async (req, res) => {
    await sucursalService.addStoreProduct(req.user.id, req.user.role, req.body);
    res.status(201).json(Respuesta.ok(null, '¡El producto ha sido añadido correctamente!', 201));
});

const updateStoreProduct = asyncHandler(async (req, res) => {
    await sucursalService.updateStoreProduct(req.params.id, req.user.id, req.user.role, req.body);
    res.json(Respuesta.ok(null, 'Producto actualizado.'));
});

const deleteStoreProduct = asyncHandler(async (req, res) => {
    await sucursalService.deleteStoreProduct(req.params.id, req.user.id, req.user.role);
    res.json(Respuesta.ok(null, 'El producto ha sido retirado del catálogo correctamente.'));
});

// ─── Schedules & Reviews ───────────────────────────────────────────────────────

const getStoreSchedules = asyncHandler(async (req, res) => {
    const data = await sucursalService.getStoreSchedules(req.params.id);
    res.json(Respuesta.ok(data, 'Éxito'));
});

const getStoreReviews = asyncHandler(async (req, res) => {
    const data = await sucursalService.getStoreReviews(req.params.id);
    res.json(Respuesta.ok(data, 'Éxito'));
});

const addStoreReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    await sucursalService.addStoreReview(req.params.id, req.user.id, rating, comment);
    res.status(201).json(Respuesta.ok(null, '¡Gracias por tu opinión! Tu reseña ha sido publicada.', 201));
});

// ─── Orders ────────────────────────────────────────────────────────────────────

const createOrder = asyncHandler(async (req, res) => {
    const data = await sucursalService.createOrder(req.user.id, req.body);
    res.status(201).json(Respuesta.ok(data, '¡Tu pedido ha sido realizado con éxito! Puedes coordinar los detalles por el chat.', 201));
});

const payOrder = asyncHandler(async (req, res) => {
    await sucursalService.payOrder(req.params.id, req.user.id, req.body.paymentMethod);
    res.json(Respuesta.ok(null, 'Tu pago ha sido registrado. La tienda validará la transacción en breve.'));
});

const confirmOrderPayment = asyncHandler(async (req, res) => {
    await sucursalService.confirmOrderPayment(req.params.id, req.user.id);
    res.json(Respuesta.ok(null, 'Pago confirmado. Pedido marcado como confirmado.'));
});

const getMyOrders = asyncHandler(async (req, res) => {
    const data = await sucursalService.getMyOrders(req.user.id);
    res.json(Respuesta.ok(data, 'Éxito'));
});

const getStoreOrders = asyncHandler(async (req, res) => {
    const data = await sucursalService.getStoreOrders(req.params.id, req.user.id, req.user.role);
    res.json(Respuesta.ok(data, 'Éxito'));
});

const updateOrderStatus = asyncHandler(async (req, res) => {
    await sucursalService.updateOrderStatus(req.params.id, req.user.id, req.user.role, req.body.status);
    res.json(Respuesta.ok(null, 'Estado del pedido actualizado.'));
});

// ─── Appointments for store ────────────────────────────────────────────────────

const getStoreAppointments = asyncHandler(async (req, res) => {
    const data = await sucursalService.getStoreAppointments(req.params.id, req.user.id, req.user.role);
    res.json(Respuesta.ok(data, 'Éxito'));
});

module.exports = {
    getStores, getNearbyStores, getStoreById, getMyStore, createStore, updateStore, deleteStore, updateStoreStatus,
    uploadStoreImage, uploadProductImage,
    getStoreProducts, addStoreProduct, updateStoreProduct, deleteStoreProduct,
    getStoreSchedules, getStoreReviews, addStoreReview,
    createOrder, payOrder, confirmOrderPayment, getMyOrders, getStoreOrders, updateOrderStatus,
    getStoreAppointments
};
