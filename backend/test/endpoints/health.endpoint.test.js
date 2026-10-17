/**
 * health.endpoint.test.js
 * Pruebas de integración de endpoints para Health Check y 404
 */
const { request, app } = require('../setup/endpoint-helper');

describe('GET /health y 404 handler', () => {
    test('GET /health debería responder 200 con status ok', async () => {
        const res = await request(app).get('/health');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('mensaje', 'El servidor está funcionando');
        expect(res.body).toHaveProperty('timestamp');
    });

    test('Ruta inexistente debería responder 404 Endpoint no encontrado', async () => {
        const res = await request(app).get('/api/ruta-totalmente-desconocida');

        expect(res.status).toBe(404);
        expect(res.body).toEqual({
            success: false,
            mensaje: 'Endpoint no encontrado'
        });
    });
});
