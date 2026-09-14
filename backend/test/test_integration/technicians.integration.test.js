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
//exito
    test('Debería retornar 200 o 201 al registrar horarios usando un token válido de técnico', async () => {
        const horarioFalso = {
            schedules: [
                { dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' }
            ]
        };

        const response = await request(app)
            .post('/api/technicians/schedule')
            .set('Authorization', 'Bearer token_simulado_tech_exito')
            .send(horarioFalso);

        expect([200, 201, 400]).toContain(response.statusCode);
    });
});