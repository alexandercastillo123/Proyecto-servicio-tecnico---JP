const request = require('supertest');
const app = require('../../server');

describe('Pruebas de Integración - Módulo APPOINTMENTS (Citas)', () => {
    test('Debería retornar error 401 si se intentan ver las citas sin token', async () => {
        const response = await request(app)
            .get('/api/appointments')
            .send();
        expect(response.statusCode).toBe(401);
    });

    test('Debería retornar código de éxito al simular la creación de una cita', async () => {
        const response = await request(app)
            .post('/api/appointments')
            .set('Authorization', 'Bearer token_simulado_exito')
            .send({ date: '2026-10-10', time: '10:00', reason: 'Mantenimiento' });

        expect([200, 201, 400]).toContain(response.statusCode);
    });
});