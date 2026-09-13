const request = require('supertest');
const app = require('../../server');

describe('Pruebas de Integración - Módulo ADMIN', () => {
    test('Debería retornar error 401 si se intenta listar usuarios sin un token válido', async () => {
        const response = await request(app)
            .get('/api/admin/users')
            .send();

        expect(response.statusCode).toBe(401);
    });
});