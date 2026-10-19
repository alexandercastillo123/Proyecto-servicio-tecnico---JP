/**
 * admin.endpoint.test.js
 * Pruebas de integración de endpoints para /api/admin usando Supertest
 */

jest.mock('../../services/admin.service');

const adminService = require('../../services/admin.service');
const { request, app, clientToken, techToken, adminToken, authHeader } = require('../setup/endpoint-helper');

describe('Endpoints: /api/admin', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Seguridad y Control de Acceso', () => {
        test('debería retornar 401 si no hay token de autenticación', async () => {
            const res = await request(app).get('/api/admin/appointments');
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        test('debería retornar 403 si el rol es client', async () => {
            const res = await request(app)
                .get('/api/admin/appointments')
                .set(authHeader(clientToken));

            expect(res.status).toBe(403);
            expect(res.body.message).toContain('requires admin role');
        });

        test('debería retornar 403 si el rol es tech', async () => {
            const res = await request(app)
                .get('/api/admin/appointments')
                .set(authHeader(techToken));

            expect(res.status).toBe(403);
            expect(res.body.message).toContain('requires admin role');
        });
    });

    describe('GET /api/admin/appointments', () => {
        test('debería retornar 200 y todas las citas para el rol admin', async () => {
            const mockAppointments = [{ id: 1, service_type: 'Instalación' }];
            adminService.getAllAppointments.mockResolvedValue(mockAppointments);

            const res = await request(app)
                .get('/api/admin/appointments?status=pending')
                .set(authHeader(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockAppointments);
            expect(adminService.getAllAppointments).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
        });
    });

    describe('GET /api/admin/users', () => {
        test('debería retornar 200 y lista de usuarios con perfiles', async () => {
            const mockUsers = [{ id: 1, email: 'user@test.com', role: 'tech' }];
            adminService.getAllUsers.mockResolvedValue(mockUsers);

            const res = await request(app)
                .get('/api/admin/users?role=tech')
                .set(authHeader(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockUsers);
            expect(adminService.getAllUsers).toHaveBeenCalledWith(expect.objectContaining({ role: 'tech' }));
        });
    });

    describe('GET /api/admin/sucursales', () => {
        test('debería retornar 200 y lista de todas las sucursales', async () => {
            const mockBranches = [{ id: 1, name: 'Sede Principal' }];
            adminService.getAllBranches.mockResolvedValue(mockBranches);

            const res = await request(app)
                .get('/api/admin/sucursales')
                .set(authHeader(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockBranches);
            expect(adminService.getAllBranches).toHaveBeenCalled();
        });
    });

    describe('GET /api/admin/orders', () => {
        test('debería retornar 200 y lista de todas las órdenes', async () => {
            const mockOrders = [{ id: 10, total_price: '250.00' }];
            adminService.getAllOrders.mockResolvedValue(mockOrders);

            const res = await request(app)
                .get('/api/admin/orders')
                .set(authHeader(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockOrders);
            expect(adminService.getAllOrders).toHaveBeenCalled();
        });
    });
});
