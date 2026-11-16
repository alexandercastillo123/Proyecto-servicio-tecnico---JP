/**
 * notifications.endpoint.test.js
 * Pruebas de integración de endpoints para /api/notifications usando Supertest
 */

jest.mock('../../repository/notification.repository');

const notificationRepo = require('../../repository/notification.repository');
const { request, app, clientToken, authHeader } = require('../setup/endpoint-helper');

describe('Endpoints: /api/notifications', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/notifications/settings', () => {
        test('debería retornar 401 si no hay token', async () => {
            const res = await request(app).get('/api/notifications/settings');
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        test('debería retornar 200 y configuración de notificaciones', async () => {
            const mockSettings = { push_enabled: true, chat_notifications: true };
            notificationRepo.getSettings.mockResolvedValue(mockSettings);

            const res = await request(app)
                .get('/api/notifications/settings')
                .set(authHeader(clientToken));

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockSettings);
        });
    });

    describe('PUT /api/notifications/settings', () => {
        test('debería retornar 200 al actualizar la configuración', async () => {
            notificationRepo.updateSettings.mockResolvedValue();

            const res = await request(app)
                .put('/api/notifications/settings')
                .set(authHeader(clientToken))
                .send({ push_enabled: false });

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(notificationRepo.updateSettings).toHaveBeenCalledWith(10, { push_enabled: false });
        });
    });

    describe('GET /api/notifications', () => {
        test('debería retornar 200 y lista de notificaciones del usuario', async () => {
            const mockList = [{ id: 1, title: 'Cita confirmada', read: false }];
            notificationRepo.findByUser.mockResolvedValue(mockList);

            const res = await request(app)
                .get('/api/notifications')
                .set(authHeader(clientToken));

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockList);
            expect(notificationRepo.findByUser).toHaveBeenCalledWith(10, 50);
        });
    });

    describe('PUT /api/notifications/:id/read', () => {
        test('debería retornar 200 al marcar como leída', async () => {
            notificationRepo.markAsRead.mockResolvedValue(1);

            const res = await request(app)
                .put('/api/notifications/3/read')
                .set(authHeader(clientToken));

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(notificationRepo.markAsRead).toHaveBeenCalledWith('3', 10);
        });

        test('debería retornar 404 si la notificación no existe o pertenece a otro usuario', async () => {
            notificationRepo.markAsRead.mockResolvedValue(0);

            const res = await request(app)
                .put('/api/notifications/999/read')
                .set(authHeader(clientToken));

            expect(res.status).toBe(404);
            expect(res.body.exito).toBe(false);
        });
    });

    describe('POST /api/notifications/token', () => {
        test('debería retornar 200 al registrar token FCM', async () => {
            notificationRepo.saveToken.mockResolvedValue();

            const res = await request(app)
                .post('/api/notifications/token')
                .set(authHeader(clientToken))
                .send({ token: 'fcm_token_123', platform: 'android' });

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(notificationRepo.saveToken).toHaveBeenCalledWith(10, 'fcm_token_123', 'android');
        });

        test('debería retornar 400 si falta el token', async () => {
            const res = await request(app)
                .post('/api/notifications/token')
                .set(authHeader(clientToken))
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.exito).toBe(false);
        });
    });
});
