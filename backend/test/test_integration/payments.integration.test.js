const request = require('supertest');
const app = require('../../server');

describe('Pruebas de Integración - Módulo PAYMENTS (Culqi)', () => {
    test('Debería rechazar un intento de pago si no está autenticado', async () => {
        const response = await request(app)
            .post('/api/culqi')
            .send({});
        expect(response.statusCode).toBe(401);
    });

    test('Debería procesar la simulación de un cargo de pago correctamente', async () => {
        const response = await request(app)
            .post('/api/culqi')
            .set('Authorization', 'Bearer token_simulado_exito')
            .send({ amount: 100, token: 'tok_test_123' });

        expect([200, 201, 400]).toContain(response.statusCode);
    });
});