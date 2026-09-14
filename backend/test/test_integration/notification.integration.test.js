const request = require('supertest');
const app = require('../../server');

describe('Pruebas de Integración - Módulo NOTIFICATIONS', () => {
    test('Debería denegar el acceso a las notificaciones si no hay autenticación', async () => {
        const response = await request(app)
            .get('/api/notifications')
            .send();
        expect(response.statusCode).toBe(401);
    });

    test('Debería obtener las notificaciones con éxito usando un token', async () => {
        const response = await request(app)
            .get('/api/notifications')
            .set('Authorization', 'Bearer token_simulado_exito')
            .send();

        expect([200, 404]).toContain(response.statusCode);
    });
});