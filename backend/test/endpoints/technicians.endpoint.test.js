/**
 * technicians.endpoint.test.js
 * Pruebas de integración de endpoints para /api/technicians usando Supertest
 */

jest.mock('../../services/technician.service');

const technicianService = require('../../services/technician.service');
const AppError = require('../../utils/AppError');
const { request, app, clientToken, techToken, authHeader } = require('../setup/endpoint-helper');

describe('Endpoints: /api/technicians', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/technicians/nearby', () => {
        test('debería retornar 200 y técnicos cercanos cuando se envían coordenadas', async () => {
            const mockNearby = [{ id: 1, name: 'Técnico 1', distance: 1.5 }];
            technicianService.getNearbyTechnicians.mockResolvedValue(mockNearby);

            const res = await request(app)
                .get('/api/technicians/nearby?lat=-12.0463&lng=-77.0427&radius=5');

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockNearby);
        });

        test('debería retornar 400 si faltan parámetros de coordenadas', async () => {
            technicianService.getNearbyTechnicians.mockRejectedValue(
                new AppError('lat y lng son requeridos y deben ser números válidos.', 400)
            );

            const res = await request(app).get('/api/technicians/nearby');

            expect(res.status).toBe(400);
            expect(res.body.exito).toBe(false);
        });
    });

    describe('GET /api/technicians', () => {
        test('debería retornar 200 y lista paginada de técnicos', async () => {
            const mockData = {
                technicians: [{ id: 1, name: 'Tech 1' }],
                pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
            };
            technicianService.getTechnicians.mockResolvedValue(mockData);

            const res = await request(app).get('/api/technicians?city=Lima');

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockData);
        });
    });

    describe('GET /api/technicians/:id', () => {
        test('debería retornar 200 y detalles del técnico', async () => {
            const mockTech = { id: 2, name: 'Tech 2', schedule: [] };
            technicianService.getTechnicianById.mockResolvedValue(mockTech);

            const res = await request(app).get('/api/technicians/2');

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockTech);
        });

        test('debería retornar 404 si el técnico no existe', async () => {
            technicianService.getTechnicianById.mockRejectedValue(
                new AppError('Técnico no encontrado.', 404)
            );

            const res = await request(app).get('/api/technicians/999');

            expect(res.status).toBe(404);
            expect(res.body.exito).toBe(false);
        });
    });

    describe('GET /api/technicians/:id/schedule', () => {
        test('debería retornar 200 y horario del técnico', async () => {
            const mockSchedule = [{ day_of_week: 'Monday', start_time: '08:00:00' }];
            technicianService.getTechnicianSchedule.mockResolvedValue(mockSchedule);

            const res = await request(app).get('/api/technicians/2/schedule');

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockSchedule);
        });
    });

    describe('POST /api/technicians/schedule', () => {
        test('debería retornar 401 si no está autenticado', async () => {
            const res = await request(app)
                .post('/api/technicians/schedule')
                .send({ schedules: [] });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        test('debería retornar 403 si el rol no es tech', async () => {
            const res = await request(app)
                .post('/api/technicians/schedule')
                .set(authHeader(clientToken))
                .send({ schedules: [] });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        test('debería retornar 200 al crear horario con rol tech', async () => {
            technicianService.createSchedule.mockResolvedValue();

            const res = await request(app)
                .post('/api/technicians/schedule')
                .set(authHeader(techToken))
                .send({
                    schedules: [
                        { dayOfWeek: 'Monday', startTime: '08:00', endTime: '12:00' }
                    ]
                });

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
        });
    });

    describe('POST /api/technicians/review', () => {
        test('debería retornar 401 si no está autenticado', async () => {
            const res = await request(app)
                .post('/api/technicians/review')
                .send({ technicianId: 2, rating: 5 });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        test('debería retornar 201 al agregar reseña exitosamente', async () => {
            technicianService.addReview.mockResolvedValue({ id: 1 });

            const res = await request(app)
                .post('/api/technicians/review')
                .set(authHeader(clientToken))
                .send({ technicianId: 2, rating: 5, comment: 'Excelente servicio' });

            expect(res.status).toBe(201);
            expect(res.body.exito).toBe(true);
        });

        test('debería retornar 400 si rating es inválido', async () => {
            const res = await request(app)
                .post('/api/technicians/review')
                .set(authHeader(clientToken))
                .send({ technicianId: 2, rating: 10 });

            expect(res.status).toBe(400);
            expect(res.body.exito).toBe(false);
        });
    });
});
