/**
 * sucursal.service.test.js
 * Pruebas unitarias para sucursal.service.js
 */

const mockConn = {
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
    query: jest.fn()
};

const mockPool = {
    getConnection: jest.fn().mockResolvedValue(mockConn)
};

jest.mock('../../config/database', () => ({
    pool: mockPool,
    query: jest.fn()
}));

jest.mock('../../repository/sucursal.repository');
jest.mock('../../repository/user.repository');
jest.mock('../../services/notification.service');
jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed_password_123')
}));

const sucursalRepo = require('../../repository/sucursal.repository');
const userRepo = require('../../repository/user.repository');
const notificationService = require('../../services/notification.service');
const sucursalService = require('../../services/sucursal.service');
const bcrypt = require('bcryptjs');
const AppError = require('../../utils/AppError');

describe('sucursal.service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPool.getConnection.mockResolvedValue(mockConn);
        mockConn.beginTransaction.mockResolvedValue();
        mockConn.commit.mockResolvedValue();
        mockConn.rollback.mockResolvedValue();
        mockConn.release.mockReturnValue();
        mockConn.query.mockResolvedValue([[]]);
    });

    // ─── Stores ───────────────────────────────────────────────────────────────
    describe('Stores CRUD & Status', () => {
        describe('getStores', () => {
            test('debería retornar el listado de todas las sucursales', async () => {
                const stores = [{ id: 1, name: 'Sucursal Central' }];
                sucursalRepo.findAll.mockResolvedValue(stores);

                const result = await sucursalService.getStores();

                expect(sucursalRepo.findAll).toHaveBeenCalled();
                expect(result).toEqual(stores);
            });
        });

        describe('getNearbyStores', () => {
            test('debería lanzar AppError 400 si falta lat o lng', async () => {
                await expect(sucursalService.getNearbyStores(null, -77.0)).rejects.toThrow(
                    new AppError('Se requieren lat y lng.', 400)
                );
                await expect(sucursalService.getNearbyStores(-12.0, null)).rejects.toThrow(
                    new AppError('Se requieren lat y lng.', 400)
                );
            });

            test('debería consultar sucursales cercanas con radio por defecto (10)', async () => {
                const stores = [{ id: 2, distance_km: 3.2 }];
                sucursalRepo.findNearby.mockResolvedValue(stores);

                const result = await sucursalService.getNearbyStores(-12.04, -77.03);

                expect(sucursalRepo.findNearby).toHaveBeenCalledWith(-12.04, -77.03, 10);
                expect(result).toEqual(stores);
            });
        });

        describe('getStoreById', () => {
            test('debería retornar la sucursal solicitada si existe', async () => {
                const store = { id: 5, name: 'Sucursal Miraflores' };
                sucursalRepo.findById.mockResolvedValue(store);

                const result = await sucursalService.getStoreById(5);

                expect(sucursalRepo.findById).toHaveBeenCalledWith(5);
                expect(result).toEqual(store);
            });

            test('debería lanzar AppError 404 si la sucursal no existe', async () => {
                sucursalRepo.findById.mockResolvedValue(null);

                await expect(sucursalService.getStoreById(999)).rejects.toThrow(
                    new AppError('No logramos encontrar la sucursal solicitada.', 404)
                );
            });
        });

        describe('getMyStore', () => {
            test('debería retornar la sucursal vinculada al userId', async () => {
                const store = { id: 8, user_id: 15, name: 'Mi Tienda' };
                sucursalRepo.findByUserId.mockResolvedValue(store);

                const result = await sucursalService.getMyStore(15);

                expect(sucursalRepo.findByUserId).toHaveBeenCalledWith(15);
                expect(result).toEqual(store);
            });

            test('debería lanzar AppError 404 si el usuario no tiene sucursal', async () => {
                sucursalRepo.findByUserId.mockResolvedValue(null);

                await expect(sucursalService.getMyStore(15)).rejects.toThrow(
                    new AppError('Aún no cuentas con una sucursal registrada.', 404)
                );
            });
        });

        describe('createStore', () => {
            test('admin: crea usuario store con email/password y la sucursal en una transacción', async () => {
                userRepo.emailExists.mockResolvedValue(false);
                userRepo.usernameExists.mockResolvedValue(false);
                userRepo.createBasic.mockResolvedValue(50);
                userRepo.createBasicProfile.mockResolvedValue();
                sucursalRepo.create.mockResolvedValue(1);

                const requestUser = { id: 1, role: 'admin' };
                const body = {
                    name: 'Tienda Electro',
                    admin_email: 'tienda@electro.com',
                    admin_password: 'Password123!',
                    phone: '999888777',
                    address: 'Av. Siempre Viva 123',
                    city: 'Lima'
                };

                const result = await sucursalService.createStore(requestUser, body);

                expect(mockConn.beginTransaction).toHaveBeenCalled();
                expect(userRepo.emailExists).toHaveBeenCalledWith('tienda@electro.com');
                expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
                expect(userRepo.createBasic).toHaveBeenCalledWith('tienda@electro.com', 'tienda_electro', 'hashed_password_123', 'store', mockConn);
                expect(userRepo.createBasicProfile).toHaveBeenCalledWith(50, {
                    phone: '999888777',
                    address: 'Av. Siempre Viva 123',
                    city: 'Lima',
                    personType: 'juridical',
                    names: 'Tienda Electro'
                }, mockConn);
                expect(sucursalRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                    userId: 50,
                    name: 'Tienda Electro'
                }), mockConn);
                expect(mockConn.commit).toHaveBeenCalled();
                expect(mockConn.release).toHaveBeenCalled();
                expect(result).toEqual({ userId: 50 });
            });

            test('admin: genera username con sufijo aleatorio si el slug ya existe', async () => {
                userRepo.emailExists.mockResolvedValue(false);
                userRepo.usernameExists.mockResolvedValue(true); // Ya existe slug
                userRepo.createBasic.mockResolvedValue(51);
                userRepo.createBasicProfile.mockResolvedValue();
                sucursalRepo.create.mockResolvedValue(2);

                const requestUser = { id: 1, role: 'admin' };
                const body = {
                    name: 'Tienda Duplicada',
                    admin_email: 'tienda2@dup.com',
                    admin_password: 'Pass',
                    phone: '999',
                    address: 'Calle 1',
                    city: 'Lima'
                };

                await sucursalService.createStore(requestUser, body);

                expect(userRepo.createBasic).toHaveBeenCalledWith(
                    'tienda2@dup.com',
                    expect.stringMatching(/^tienda_duplicada_\d+$/),
                    'hashed_password_123',
                    'store',
                    mockConn
                );
            });

            test('admin: lanza AppError 400 y rollback si el email ya existe', async () => {
                userRepo.emailExists.mockResolvedValue(true);

                const requestUser = { id: 1, role: 'admin' };
                const body = {
                    name: 'Tienda',
                    admin_email: 'usado@correo.com',
                    admin_password: '123'
                };

                await expect(sucursalService.createStore(requestUser, body)).rejects.toThrow(
                    new AppError('El correo del administrador de la sucursal ya está registrado.', 400)
                );
                expect(mockConn.rollback).toHaveBeenCalled();
                expect(mockConn.release).toHaveBeenCalled();
            });

            test('no-admin: crea sucursal para su propio userId y verifica que no tenga una previa', async () => {
                sucursalRepo.existsByUserId.mockResolvedValue(false);
                sucursalRepo.create.mockResolvedValue(3);

                const requestUser = { id: 25, role: 'store' };
                const body = { name: 'Mi Sucursal Propia', address: 'Av. Test' };

                const result = await sucursalService.createStore(requestUser, body);

                expect(sucursalRepo.existsByUserId).toHaveBeenCalledWith(25);
                expect(sucursalRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                    userId: 25,
                    name: 'Mi Sucursal Propia'
                }), mockConn);
                expect(mockConn.commit).toHaveBeenCalled();
                expect(result).toEqual({ userId: 25 });
            });

            test('no-admin: lanza AppError 400 si ya tiene una sucursal registrada', async () => {
                sucursalRepo.existsByUserId.mockResolvedValue(true);

                const requestUser = { id: 25, role: 'store' };
                const body = { name: 'Segunda Sucursal' };

                await expect(sucursalService.createStore(requestUser, body)).rejects.toThrow(
                    new AppError('Este usuario ya tiene una sucursal registrada.', 400)
                );
                expect(mockConn.rollback).toHaveBeenCalled();
            });
        });

        describe('updateStore', () => {
            test('debería lanzar AppError 403 si el usuario no es dueño de la tienda', async () => {
                sucursalRepo.ownsStore.mockResolvedValue(false);

                await expect(sucursalService.updateStore(5, 10, { name: 'Nuevo' })).rejects.toThrow(
                    new AppError('No autorizado.', 403)
                );
            });

            test('debería lanzar AppError 400 si no hay campos para actualizar', async () => {
                sucursalRepo.ownsStore.mockResolvedValue(true);

                await expect(sucursalService.updateStore(5, 10, {})).rejects.toThrow(
                    new AppError('No hay campos para actualizar.', 400)
                );
            });

            test('debería actualizar los campos si el usuario es el dueño', async () => {
                sucursalRepo.ownsStore.mockResolvedValue(true);
                sucursalRepo.update.mockResolvedValue();

                await sucursalService.updateStore(5, 10, { phone: '987654321' });

                expect(sucursalRepo.update).toHaveBeenCalledWith(5, 10, { phone: '987654321' });
            });
        });

        describe('deleteStore', () => {
            test('debería delegar el borrado al repositorio', async () => {
                sucursalRepo.remove.mockResolvedValue();

                await sucursalService.deleteStore(9);

                expect(sucursalRepo.remove).toHaveBeenCalledWith(9);
            });
        });

        describe('updateStoreStatus', () => {
            test('debería lanzar AppError 403 si no es dueño', async () => {
                sucursalRepo.ownsStore.mockResolvedValue(false);

                await expect(sucursalService.updateStoreStatus(9, 10, 'inactive')).rejects.toThrow(
                    new AppError('No tienes permisos para esta acción.', 403)
                );
            });

            test('debería actualizar el estado de la sucursal', async () => {
                sucursalRepo.ownsStore.mockResolvedValue(true);
                sucursalRepo.updateStatus.mockResolvedValue();

                await sucursalService.updateStoreStatus(9, 10, 'active');

                expect(sucursalRepo.updateStatus).toHaveBeenCalledWith(9, 'active');
            });
        });
    });

    // ─── Products ─────────────────────────────────────────────────────────────
    describe('Products', () => {
        test('getStoreProducts retorna los productos de la sucursal', async () => {
            const products = [{ id: 1, name: 'Mouse' }];
            sucursalRepo.getProducts.mockResolvedValue(products);

            const result = await sucursalService.getStoreProducts(4);

            expect(sucursalRepo.getProducts).toHaveBeenCalledWith(4);
            expect(result).toEqual(products);
        });

        describe('addStoreProduct', () => {
            test('debería lanzar AppError 400 si faltan campos obligatorios', async () => {
                await expect(sucursalService.addStoreProduct(10, 'store', { name: 'Teclado' })).rejects.toThrow(
                    new AppError('Completa todos los campos obligatorios del producto.', 400)
                );
            });

            test('debería lanzar AppError 403 si no es dueño ni admin', async () => {
                sucursalRepo.ownsStore.mockResolvedValue(false);

                await expect(sucursalService.addStoreProduct(10, 'store', {
                    sucursal_id: 1,
                    name: 'Teclado',
                    price: 50
                })).rejects.toThrow(
                    new AppError('No tienes permisos para añadir productos a esta sucursal.', 403)
                );
            });

            test('debería permitir añadir producto si es dueño', async () => {
                sucursalRepo.ownsStore.mockResolvedValue(true);
                sucursalRepo.insertProduct.mockResolvedValue(101);

                const data = { sucursal_id: 1, name: 'Teclado Mecánico', price: 150 };
                await sucursalService.addStoreProduct(10, 'store', data);

                expect(sucursalRepo.insertProduct).toHaveBeenCalledWith(data);
            });

            test('debería permitir añadir producto si es admin aunque no sea dueño', async () => {
                sucursalRepo.ownsStore.mockResolvedValue(false);
                sucursalRepo.insertProduct.mockResolvedValue(102);

                const data = { sucursal_id: 1, name: 'Monitor', price: 500 };
                await sucursalService.addStoreProduct(99, 'admin', data);

                expect(sucursalRepo.insertProduct).toHaveBeenCalledWith(data);
            });
        });

        describe('updateStoreProduct', () => {
            test('debería lanzar AppError 404 si el producto no existe', async () => {
                sucursalRepo.findProductWithStore.mockResolvedValue(null);

                await expect(sucursalService.updateStoreProduct(50, 10, 'store', { price: 200 })).rejects.toThrow(
                    new AppError('Producto no encontrado.', 404)
                );
            });

            test('debería lanzar AppError 403 si no es dueño del producto ni admin', async () => {
                sucursalRepo.findProductWithStore.mockResolvedValue({ id: 50, user_id: 88 });

                await expect(sucursalService.updateStoreProduct(50, 10, 'store', { price: 200 })).rejects.toThrow(
                    new AppError('No autorizado para editar este producto.', 403)
                );
            });

            test('debería lanzar AppError 400 si fields está vacío', async () => {
                sucursalRepo.findProductWithStore.mockResolvedValue({ id: 50, user_id: 10 });

                await expect(sucursalService.updateStoreProduct(50, 10, 'store', {})).rejects.toThrow(
                    new AppError('No hay campos para actualizar.', 400)
                );
            });

            test('debería actualizar el producto correctamente para el dueño', async () => {
                sucursalRepo.findProductWithStore.mockResolvedValue({ id: 50, user_id: 10 });
                sucursalRepo.updateProduct.mockResolvedValue();

                await sucursalService.updateStoreProduct(50, 10, 'store', { price: 220 });

                expect(sucursalRepo.updateProduct).toHaveBeenCalledWith(50, { price: 220 });
            });
        });

        describe('deleteStoreProduct', () => {
            test('debería lanzar AppError 404 si no existe', async () => {
                sucursalRepo.findProductWithStore.mockResolvedValue(null);

                await expect(sucursalService.deleteStoreProduct(50, 10, 'store')).rejects.toThrow(
                    new AppError('Producto no encontrado.', 404)
                );
            });

            test('debería lanzar AppError 403 si no tiene permisos', async () => {
                sucursalRepo.findProductWithStore.mockResolvedValue({ id: 50, user_id: 99 });

                await expect(sucursalService.deleteStoreProduct(50, 10, 'store')).rejects.toThrow(
                    new AppError('No autorizado para eliminar este producto.', 403)
                );
            });

            test('debería eliminar el producto si es admin', async () => {
                sucursalRepo.findProductWithStore.mockResolvedValue({ id: 50, user_id: 99 });
                sucursalRepo.deleteProduct.mockResolvedValue();

                await sucursalService.deleteStoreProduct(50, 1, 'admin');

                expect(sucursalRepo.deleteProduct).toHaveBeenCalledWith(50);
            });
        });
    });

    // ─── Schedules & Reviews ──────────────────────────────────────────────────
    describe('Schedules & Reviews', () => {
        test('getStoreSchedules y getStoreReviews delegan al repositorio', async () => {
            sucursalRepo.getSchedules.mockResolvedValue([{ id: 1 }]);
            sucursalRepo.getReviews.mockResolvedValue([{ id: 2 }]);

            const schedules = await sucursalService.getStoreSchedules(5);
            const reviews = await sucursalService.getStoreReviews(5);

            expect(schedules).toEqual([{ id: 1 }]);
            expect(reviews).toEqual([{ id: 2 }]);
        });

        describe('addStoreReview', () => {
            test('debería lanzar AppError 403 si el cliente no ha completado una transacción', async () => {
                sucursalRepo.hasCompletedTransaction.mockResolvedValue(false);

                await expect(sucursalService.addStoreReview(5, 12, 5, 'Buena tienda')).rejects.toThrow(
                    new AppError('Solo puedes reseñar después de haber completado una compra o servicio con esta sucursal.', 403)
                );
            });

            test('debería lanzar AppError 400 si ya existe una reseña previa', async () => {
                sucursalRepo.hasCompletedTransaction.mockResolvedValue(true);
                sucursalRepo.hasExistingReview.mockResolvedValue(true);

                await expect(sucursalService.addStoreReview(5, 12, 5, 'Buena tienda')).rejects.toThrow(
                    new AppError('Ya has calificado a esta sucursal.', 400)
                );
            });

            test('debería insertar la reseña y recalcular el rating', async () => {
                sucursalRepo.hasCompletedTransaction.mockResolvedValue(true);
                sucursalRepo.hasExistingReview.mockResolvedValue(false);
                sucursalRepo.insertReview.mockResolvedValue(10);
                sucursalRepo.recalculateRating.mockResolvedValue();

                await sucursalService.addStoreReview(5, 12, 4, 'Excelente');

                expect(sucursalRepo.insertReview).toHaveBeenCalledWith(5, 12, 4, 'Excelente');
                expect(sucursalRepo.recalculateRating).toHaveBeenCalledWith(5);
            });
        });
    });

    // ─── Orders ───────────────────────────────────────────────────────────────
    describe('Orders', () => {
        describe('createOrder', () => {
            test('debería lanzar AppError 400 si no se envían productos', async () => {
                await expect(sucursalService.createOrder(12, {})).rejects.toThrow(
                    new AppError('Debes seleccionar al menos un producto con cantidad.', 400)
                );
            });

            test('debería lanzar AppError 404 si un producto no está disponible', async () => {
                sucursalRepo.findProductForOrder.mockResolvedValue(null);

                await expect(sucursalService.createOrder(12, {
                    product_id: 10,
                    quantity: 2
                })).rejects.toThrow(
                    new AppError('Uno de los productos seleccionados ya no está disponible.', 404)
                );
                expect(mockConn.rollback).toHaveBeenCalled();
            });

            test('debería lanzar AppError 400 si los productos pertenecen a diferentes sucursales', async () => {
                sucursalRepo.findProductForOrder
                    .mockResolvedValueOnce({ sucursal_id: 1, name: 'P1', price: '20.00' })
                    .mockResolvedValueOnce({ sucursal_id: 2, name: 'P2', price: '30.00' });

                const payload = {
                    products: [
                        { product_id: 1, quantity: 1 },
                        { product_id: 2, quantity: 1 }
                    ]
                };

                await expect(sucursalService.createOrder(12, payload)).rejects.toThrow(
                    new AppError('Todos los productos deben pertenecer a la misma sucursal.', 400)
                );
                expect(mockConn.rollback).toHaveBeenCalled();
            });

            test('debería crear el pedido, productos, mensaje de chat y notificar al dueño de la sucursal', async () => {
                sucursalRepo.findProductForOrder.mockResolvedValue({
                    sucursal_id: 1,
                    name: 'Disco SSD 1TB',
                    price: '100.00'
                });
                sucursalRepo.insertOrder.mockResolvedValue(77);
                sucursalRepo.insertOrderProduct.mockResolvedValue();
                sucursalRepo.findStoreOwner.mockResolvedValue(55); // store user id
                sucursalRepo.insertOrderChatMessageConn.mockResolvedValue();
                notificationService.createNotification.mockResolvedValue(true);

                const result = await sucursalService.createOrder(12, {
                    product_id: 10,
                    quantity: 2,
                    delivery_address: 'Av. Larco 456',
                    latitude: -12.1,
                    longitude: -77.0
                });

                expect(mockConn.beginTransaction).toHaveBeenCalled();
                expect(sucursalRepo.insertOrder).toHaveBeenCalledWith({
                    clientId: 12,
                    sucursalId: 1,
                    productId: 10,
                    quantity: 2,
                    unitPrice: 100,
                    totalPrice: 200,
                    deliveryAddress: 'Av. Larco 456',
                    latitude: -12.1,
                    longitude: -77.0
                }, mockConn);
                expect(sucursalRepo.insertOrderProduct).toHaveBeenCalledWith(77, 10, 2, 100, mockConn);
                expect(sucursalRepo.insertOrderChatMessageConn).toHaveBeenCalledWith(
                    mockConn,
                    12,
                    55,
                    expect.stringContaining('Disco SSD 1TB'),
                    77
                );
                expect(notificationService.createNotification).toHaveBeenCalledWith(
                    55,
                    'Nuevo Pedido Recibido',
                    'Has recibido un pedido de "Disco SSD 1TB" (x2)',
                    'order',
                    { orderId: '77', productId: '10' }
                );
                expect(mockConn.commit).toHaveBeenCalled();
                expect(mockConn.release).toHaveBeenCalled();
                expect(result).toEqual({ orderId: 77 });
            });
        });

        describe('payOrder', () => {
            test('debería lanzar AppError 400 si el método de pago es inválido', async () => {
                await expect(sucursalService.payOrder(1, 10, 'crypto')).rejects.toThrow(
                    new AppError('Método de pago inválido.', 400)
                );
            });

            test('debería lanzar AppError 404 si el pedido no existe', async () => {
                sucursalRepo.findOrderById.mockResolvedValue(null);

                await expect(sucursalService.payOrder(99, 10, 'yape')).rejects.toThrow(
                    new AppError('Pedido no encontrado.', 404)
                );
            });

            test('debería lanzar AppError 403 si el usuario que intenta pagar no es el cliente', async () => {
                sucursalRepo.findOrderById.mockResolvedValue({
                    id: 1,
                    client_id: 12,
                    payment_status: 'pending'
                });

                await expect(sucursalService.payOrder(1, 999, 'yape')).rejects.toThrow(
                    new AppError('Solo el cliente puede pagar este pedido.', 403)
                );
            });

            test('debería lanzar AppError 400 si el pedido no está en status pending', async () => {
                sucursalRepo.findOrderById.mockResolvedValue({
                    id: 1,
                    client_id: 12,
                    payment_status: 'paid'
                });

                await expect(sucursalService.payOrder(1, 12, 'yape')).rejects.toThrow(
                    new AppError('Este pedido ya cuenta con un registro de pago en curso o completado.', 400)
                );
            });

            test('debería actualizar estado de pago a waiting, registrar mensaje de chat y notificar', async () => {
                sucursalRepo.findOrderById.mockResolvedValue({
                    id: 1,
                    client_id: 12,
                    store_user_id: 55,
                    payment_status: 'pending',
                    total_price: '150.00',
                    product_name: 'Impresora HP'
                });
                sucursalRepo.updateOrderPaymentWaiting.mockResolvedValue();
                sucursalRepo.insertOrderChatMessage.mockResolvedValue();
                notificationService.createNotification.mockResolvedValue(true);

                await sucursalService.payOrder(1, 12, 'yape');

                expect(sucursalRepo.updateOrderPaymentWaiting).toHaveBeenCalledWith(1, 'yape');
                expect(sucursalRepo.insertOrderChatMessage).toHaveBeenCalledWith(
                    12,
                    55,
                    expect.stringContaining('YAPE'),
                    1
                );
                expect(notificationService.createNotification).toHaveBeenCalledWith(
                    55,
                    'Pago de Pedido Recibido',
                    'El cliente ha notificado el pago por "Impresora HP"',
                    'order',
                    { orderId: '1', action: 'payment_received' }
                );
            });
        });

        describe('confirmOrderPayment', () => {
            test('debería lanzar AppError 404 si la orden no existe', async () => {
                sucursalRepo.findOrderById.mockResolvedValue(null);

                await expect(sucursalService.confirmOrderPayment(1, 55)).rejects.toThrow(
                    new AppError('Pedido no encontrado.', 404)
                );
            });

            test('debería lanzar AppError 403 si quien confirma no es la tienda', async () => {
                sucursalRepo.findOrderById.mockResolvedValue({
                    id: 1,
                    store_user_id: 55,
                    payment_status: 'waiting_confirmation'
                });

                await expect(sucursalService.confirmOrderPayment(1, 999)).rejects.toThrow(
                    new AppError('Solo la tienda puede confirmar el pago.', 403)
                );
            });

            test('debería lanzar AppError 400 si la orden no está en waiting_confirmation', async () => {
                sucursalRepo.findOrderById.mockResolvedValue({
                    id: 1,
                    store_user_id: 55,
                    payment_status: 'pending'
                });

                await expect(sucursalService.confirmOrderPayment(1, 55)).rejects.toThrow(
                    new AppError('No hay un pago pendiente de confirmación para este pedido.', 400)
                );
            });

            test('debería confirmar el pago, enviar chat al cliente y notificar', async () => {
                sucursalRepo.findOrderById.mockResolvedValue({
                    id: 1,
                    client_id: 12,
                    store_user_id: 55,
                    payment_status: 'waiting_confirmation',
                    total_price: '200.00',
                    product_name: 'Monitor'
                });
                sucursalRepo.confirmOrderPayment.mockResolvedValue();
                sucursalRepo.insertOrderChatMessage.mockResolvedValue();
                notificationService.createNotification.mockResolvedValue(true);

                await sucursalService.confirmOrderPayment(1, 55);

                expect(sucursalRepo.confirmOrderPayment).toHaveBeenCalledWith(1);
                expect(sucursalRepo.insertOrderChatMessage).toHaveBeenCalledWith(
                    55,
                    12,
                    expect.stringContaining('¡Pago confirmado!'),
                    1
                );
                expect(notificationService.createNotification).toHaveBeenCalledWith(
                    12,
                    '¡Pago Confirmado!',
                    'La tienda ha confirmado tu pago por "Monitor"',
                    'order',
                    { orderId: '1', action: 'payment_confirmed' }
                );
            });
        });

        describe('getMyOrders & getStoreOrders', () => {
            test('getMyOrders retorna pedidos del cliente', async () => {
                sucursalRepo.findMyOrders.mockResolvedValue([{ id: 1 }]);
                const res = await sucursalService.getMyOrders(12);
                expect(res).toEqual([{ id: 1 }]);
            });

            test('getStoreOrders lanza 403 si el usuario no es dueño ni admin', async () => {
                sucursalRepo.ownsStore.mockResolvedValue(false);
                await expect(sucursalService.getStoreOrders(5, 10, 'client')).rejects.toThrow(
                    new AppError('No autorizado.', 403)
                );
            });

            test('getStoreOrders retorna pedidos si es dueño o admin', async () => {
                sucursalRepo.ownsStore.mockResolvedValue(true);
                sucursalRepo.findStoreOrders.mockResolvedValue([{ id: 8 }]);

                const res = await sucursalService.getStoreOrders(5, 10, 'store');
                expect(res).toEqual([{ id: 8 }]);
            });
        });

        describe('updateOrderStatus', () => {
            test('debería lanzar AppError 404 si la orden no existe', async () => {
                sucursalRepo.findOrderForStatus.mockResolvedValue(null);

                await expect(sucursalService.updateOrderStatus(1, 10, 'store', 'confirmed')).rejects.toThrow(
                    new AppError('Pedido no encontrado.', 404)
                );
                expect(mockConn.rollback).toHaveBeenCalled();
            });

            test('debería lanzar AppError 403 si un cliente intenta cambiar a un estado no permitido (ej. shipped)', async () => {
                sucursalRepo.findOrderForStatus.mockResolvedValue({
                    id: 1,
                    client_id: 12,
                    store_user_id: 55,
                    product_name: 'Mouse'
                });

                await expect(sucursalService.updateOrderStatus(1, 12, 'client', 'shipped')).rejects.toThrow(
                    new AppError('No autorizado para cambiar el estado de este pedido.', 403)
                );
            });

            test('cliente puede cancelar su pedido y se inserta mensaje en chat', async () => {
                sucursalRepo.findOrderForStatus.mockResolvedValue({
                    id: 1,
                    client_id: 12,
                    store_user_id: 55,
                    product_name: 'Mouse'
                });
                sucursalRepo.updateOrderStatus.mockResolvedValue();

                await sucursalService.updateOrderStatus(1, 12, 'client', 'cancelled');

                expect(sucursalRepo.updateOrderStatus).toHaveBeenCalledWith(1, 'cancelled', mockConn);
                expect(mockConn.query).toHaveBeenCalledWith(
                    expect.stringContaining('INSERT INTO chat_messages'),
                    [12, 55, expect.stringContaining('Pedido Cancelado'), 1]
                );
                expect(mockConn.commit).toHaveBeenCalled();
            });

            test('dueño de tienda puede marcar como enviado (shipped) y notifica al cliente', async () => {
                sucursalRepo.findOrderForStatus.mockResolvedValue({
                    id: 1,
                    client_id: 12,
                    store_user_id: 55,
                    product_name: 'Teclado'
                });
                sucursalRepo.updateOrderStatus.mockResolvedValue();
                notificationService.notifyOrderStatus.mockResolvedValue(true);

                await sucursalService.updateOrderStatus(1, 55, 'store', 'shipped');

                expect(sucursalRepo.updateOrderStatus).toHaveBeenCalledWith(1, 'shipped', mockConn);
                expect(mockConn.query).toHaveBeenCalledWith(
                    expect.stringContaining('INSERT INTO chat_messages'),
                    [55, 12, expect.stringContaining('Pedido en Camino'), 1]
                );
                expect(notificationService.notifyOrderStatus).toHaveBeenCalledWith(12, 1, 'shipped', 'Teclado');
                expect(mockConn.commit).toHaveBeenCalled();
            });
        });

        describe('getStoreAppointments', () => {
            test('debería lanzar AppError 403 si el usuario no es dueño de la sucursal ni admin', async () => {
                sucursalRepo.ownsStore.mockResolvedValue(false);

                await expect(sucursalService.getStoreAppointments(5, 10, 'client')).rejects.toThrow(
                    new AppError('No autorizado.', 403)
                );
            });

            test('debería retornar las citas de la sucursal si es dueño', async () => {
                sucursalRepo.ownsStore.mockResolvedValue(true);
                sucursalRepo.findStoreAppointments.mockResolvedValue([{ id: 101 }]);

                const res = await sucursalService.getStoreAppointments(5, 10, 'store');
                expect(res).toEqual([{ id: 101 }]);
            });
        });
    });
});
