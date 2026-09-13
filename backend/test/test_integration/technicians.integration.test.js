const request = require('supertest');
const app = require('../../server');

describe('Pruebas de Integración - Módulo TECHNICIANS', () => {
    test('Debería obtener la lista pública de técnicos con éxito', async () => {
        const response = await request(app)
            .get('/api/technicians')
            .send();

        expect(response.statusCode).toBe(200);
    });

    test('Debería denegar acceso al crear un horario si no se envía token', async () => {
        const response = await request(app)
            .post('/api/technicians/schedule')
            .send({ schedules: [] });

        expect(response.statusCode).toBe(401);
    });
});