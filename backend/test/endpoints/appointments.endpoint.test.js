/**
 * appointments.endpoint.test.js
 * Pruebas de integración de endpoints para /api/appointments usando Supertest
 */

jest.mock('../../services/appointment.service');

const appointmentService = require('../../services/appointment.service');
const AppError = require('../../utils/AppError');
const { request, app, clientToken, techToken, authHeader } = require('../setup/endpoint-helper');

describe('Endpoints: /api/appointments', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/appointments', () => {
        const payload = {
            technicianId: 20,
            scheduledDate: '2026-10-15',
            scheduledTime: '10:00',
            description: 'Mantenimiento de PC'
        };

        test('debería retornar 401 si no está autenticado', async () => {
            const res = await request(app).post('/api/appointments').send(payload);
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        test('debería retornar 201 al agendar cita correctamente', async () => {
            appointmentService.createAppointment.mockResolvedValue({ id: 101 });

            const res = await request(app)
                .post('/api/appointments')
                .set(authHeader(clientToken))
                .send(payload);

            expect(res.status).toBe(201);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual({ id: 101 });
        });

        test('debería retornar 400 si faltan campos obligatorios o son inválidos', async () => {
            const res = await request(app)
                .post('/api/appointments')
                .set(authHeader(clientToken))
                .send({
                    technicianId: 'invalido',
                    scheduledDate: 'fecha_invalida'
                });

            expect(res.status).toBe(400);
            expect(res.body.exito).toBe(false);
        });
    });

    describe('GET /api/appointments', () => {
        test('debería retornar 200 y lista de citas del usuario autenticado', async () => {
            const mockAppointments = [{ id: 1, service_type: 'Reparación' }];
            appointmentService.getAppointments.mockResolvedValue(mockAppointments);

            const res = await request(app)
                .get('/api/appointments?status=pending')
                .set(authHeader(clientToken));

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockAppointments);
            expect(appointmentService.getAppointments).toHaveBeenCalledWith(10, 'pending');
        });
    });

    describe('GET /api/appointments/:id', () => {
        test('debería retornar 200 y detalles de la cita', async () => {
            const mockAppointment = { id: 5, client_id: 10, status: 'confirmed' };
            appointmentService.getAppointmentById.mockResolvedValue(mockAppointment);

            const res = await request(app)
                .get('/api/appointments/5')
                .set(authHeader(clientToken));

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockAppointment);
            expect(appointmentService.getAppointmentById).toHaveBeenCalledWith('5', 10);
        });

        test('debería retornar 404 si la cita no existe', async () => {
            appointmentService.getAppointmentById.mockRejectedValue(
                new AppError('Cita no encontrada.', 404)
            );

            const res = await request(app)
                .get('/api/appointments/999')
                .set(authHeader(clientToken));

            expect(res.status).toBe(404);
            expect(res.body.exito).toBe(false);
        });
    });

    describe('PUT /api/appointments/:id/status', () => {
        test('debería retornar 200 al actualizar estado de la cita', async () => {
            appointmentService.updateAppointmentStatus.mockResolvedValue();

            const res = await request(app)
                .put('/api/appointments/5/status')
                .set(authHeader(techToken))
                .send({ status: 'in_progress' });

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(appointmentService.updateAppointmentStatus).toHaveBeenCalledWith('5', 20, 'tech', 'in_progress');
        });

        test('debería retornar 400 si el estado no es válido', async () => {
            const res = await request(app)
                .put('/api/appointments/5/status')
                .set(authHeader(techToken))
                .send({ status: 'estado_invalido' });

            expect(res.status).toBe(400);
            expect(res.body.exito).toBe(false);
        });
    });

    describe('PATCH /api/appointments/:id/price', () => {
        test('debería retornar 200 al establecer precio', async () => {
            appointmentService.setAppointmentPrice.mockResolvedValue();

            const res = await request(app)
                .patch('/api/appointments/5/price')
                .set(authHeader(techToken))
                .send({ price: '150.00' });

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(appointmentService.setAppointmentPrice).toHaveBeenCalledWith('5', 20, '150.00');
        });
    });

    describe('POST /api/appointments/:id/pay', () => {
        test('debería retornar 200 al pagar cita con método manual', async () => {
            appointmentService.payAppointment.mockResolvedValue();

            const res = await request(app)
                .post('/api/appointments/5/pay')
                .set(authHeader(clientToken))
                .send({ paymentMethod: 'yape' });

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(appointmentService.payAppointment).toHaveBeenCalledWith('5', 10, 'yape');
        });
    });

    describe('POST /api/appointments/:id/confirm-payment', () => {
        test('debería retornar 200 al confirmar pago por técnico', async () => {
            appointmentService.confirmPayment.mockResolvedValue();

            const res = await request(app)
                .post('/api/appointments/5/confirm-payment')
                .set(authHeader(techToken));

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(appointmentService.confirmPayment).toHaveBeenCalledWith('5', 20);
        });
    });

    describe('POST /api/appointments/:id/confirm-completion', () => {
        test('debería retornar 200 al confirmar culminación por cliente', async () => {
            appointmentService.confirmCompletion.mockResolvedValue();

            const res = await request(app)
                .post('/api/appointments/5/confirm-completion')
                .set(authHeader(clientToken));

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(appointmentService.confirmCompletion).toHaveBeenCalledWith('5', 10);
        });
    });

    describe('DELETE /api/appointments/:id', () => {
        test('debería retornar 200 al cancelar cita', async () => {
            appointmentService.cancelAppointment.mockResolvedValue('cancelled');

            const res = await request(app)
                .delete('/api/appointments/5')
                .set(authHeader(clientToken));

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(appointmentService.cancelAppointment).toHaveBeenCalledWith('5', 10);
        });
    });
});
