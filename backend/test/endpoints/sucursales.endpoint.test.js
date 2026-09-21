/**
 * sucursales.endpoint.test.js
 * Pruebas de integración de endpoints para /api/sucursales usando Supertest
 */

jest.mock('../../services/sucursal.service');

const sucursalService = require('../../services/sucursal.service');
const AppError = require('../../utils/AppError');
const { request, app, clientToken, techToken, authHeader } = require('../setup/endpoint-helper');

describe('Endpoints: /api/sucursales', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/sucursales', () => {
        test('debería retornar 200 y lista de sucursales activas', async () => {
            const mockStores = [{ id: 1, name: 'Sucursal Central', city: 'Lima' }];
            sucursalService.getStores.mockResolvedValue(mockStores);

            const res = await request(app).get('/api/sucursales');

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockStores);
        });
    });

    describe('GET /api/sucursales/:id', () => {
        test('debería retornar 200 y detalles de la tienda', async () => {
            const mockStore = { id: 1, name: 'Sucursal Miraflores' };
            sucursalService.getStoreById.mockResolvedValue(mockStore);

            const res = await request(app).get('/api/sucursales/1');

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockStore);
            expect(sucursalService.getStoreById).toHaveBeenCalledWith('1');
        });

        test('debería retornar 404 si la tienda no existe', async () => {
            sucursalService.getStoreById.mockRejectedValue(
                new AppError('Tienda no encontrada.', 404)
            );

            const res = await request(app).get('/api/sucursales/999');

            expect(res.status).toBe(404);
            expect(res.body.exito).toBe(false);
        });
    });

    describe('GET /api/sucursales/:id/products', () => {
        test('debería retornar 200 y catálogo de productos de la sucursal', async () => {
            const mockProducts = [{ id: 10, name: 'Pantalla OLED', price: 150 }];
            sucursalService.getStoreProducts.mockResolvedValue(mockProducts);

            const res = await request(app).get('/api/sucursales/1/products');

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockProducts);
        });
    });

    describe('POST /api/sucursales', () => {
        const storePayload = {
            name: 'Tienda Nueva',
            address: 'Av. Larco 100',
            city: 'Lima',
            phone: '987654321'
        };

        test('debería retornar 401 si no está autenticado', async () => {
            const res = await request(app).post('/api/sucursales').send(storePayload);
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        test('debería retornar 201 al registrar tienda', async () => {
            sucursalService.createStore.mockResolvedValue({ id: 5 });

            const res = await request(app)
                .post('/api/sucursales')
                .set(authHeader(techToken))
                .send(storePayload);

            expect(res.status).toBe(201);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual({ id: 5 });
            expect(sucursalService.createStore).toHaveBeenCalledWith(
                expect.objectContaining({ id: 20, role: 'tech' }),
                storePayload
            );
        });
    });

    describe('POST /api/sucursales/orders', () => {
        const orderPayload = {
            sucursalId: 1,
            productId: 10,
            quantity: 2,
            deliveryType: 'pickup'
        };

        test('debería retornar 201 al crear pedido exitosamente', async () => {
            sucursalService.createOrder.mockResolvedValue({ id: 88, total_price: 300 });

            const res = await request(app)
                .post('/api/sucursales/orders')
                .set(authHeader(clientToken))
                .send(orderPayload);

            expect(res.status).toBe(201);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual({ id: 88, total_price: 300 });
            expect(sucursalService.createOrder).toHaveBeenCalledWith(10, orderPayload);
        });
    });

    describe('GET /api/sucursales/orders/my-orders', () => {
        test('debería retornar 200 con historial de pedidos del cliente', async () => {
            const mockOrders = [{ id: 88, product_name: 'Pantalla OLED' }];
            sucursalService.getMyOrders.mockResolvedValue(mockOrders);

            const res = await request(app)
                .get('/api/sucursales/orders/my-orders')
                .set(authHeader(clientToken));

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockOrders);
            expect(sucursalService.getMyOrders).toHaveBeenCalledWith(10);
        });
    });

    describe('PATCH /api/sucursales/orders/:id/status', () => {
        test('debería retornar 200 al actualizar estado del pedido', async () => {
            sucursalService.updateOrderStatus.mockResolvedValue();

            const res = await request(app)
                .patch('/api/sucursales/orders/88/status')
                .set(authHeader(techToken))
                .send({ status: 'confirmed' });

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(sucursalService.updateOrderStatus).toHaveBeenCalledWith('88', 20, 'tech', 'confirmed');
        });
    });
});
