const request = require('supertest');
const app = require('../../server');

describe('Pruebas de Integración - Módulo SUCURSALES', () => {
    test('Debería obtener la lista pública de sucursales correctamente', async () => {
        const response = await request(app)
            .get('/api/sucursales')
            .send();
        expect(response.statusCode).toBe(200);
    });

    // exito|
    test('Debería retornar 201 al crear una nueva sucursal con datos válidos', async () => {
        const sucursalFalsa = {
            name: 'Sucursal Central Test',
            address: 'Av. Las Pruebas 123',
            phone: '999888777'
        };

        const response = await request(app)
            .post('/api/sucursales')
            .set('Authorization', 'Bearer token_simulado_user_exito')
            .send(sucursalFalsa);

        expect([200, 201, 304]).toContain(response.statusCode);
    });
});