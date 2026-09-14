const request = require('supertest');
const app = require('../../server');

describe('Pruebas de Integración - Módulo ADMIN', () => {
    test('Debería retornar error 401 si se intenta listar usuarios sin un token válido', async () => {
        const response = await request(app)
            .get('/api/admin/users')
            .send();
        expect(response.statusCode).toBe(401);
    });

    // exito
    test('Debería retornar 200 y listar usuarios con un token simulado de administrador', async () => {
        // Simulamos un token y datos falsos que enviaría el administrador
        const response = await request(app)
            .get('/api/admin/users')
            .set('Authorization', 'Bearer token_simulado_admin_exito')
            .send();

        expect([200, 304]).toContain(response.statusCode);
    });
});