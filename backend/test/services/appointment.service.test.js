/**
 * appointment.service.test.js
 * Pruebas unitarias para appointment.service.js
 */

const mockConn = {
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
    query: jest.fn()
};

const mockPool = {
    getConnection: jest.fn().mockResolvedValue(mockConn),
    query: jest.fn()
};

jest.mock('../../config/database', () => ({
    pool: mockPool
}));

jest.mock('../../repository/appointment.repository');
jest.mock('../../services/notification.service');

const mockEmit = jest.fn();
const mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
const mockIO = {
    to: mockTo,
    emit: mockEmit
};

jest.mock('../../config/socketManager', () => ({
    getIO: jest.fn().mockReturnValue(mockIO)
}));

const appointmentRepo = require('../../repository/appointment.repository');
const notificationService = require('../../services/notification.service');
const { getIO } = require('../../config/socketManager');
const appointmentService = require('../../services/appointment.service');
const AppError = require('../../utils/AppError');

describe('appointment.service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPool.getConnection.mockResolvedValue(mockConn);
        mockConn.beginTransaction.mockResolvedValue();
        mockConn.commit.mockResolvedValue();
        mockConn.rollback.mockResolvedValue();
        mockConn.release.mockReturnValue();
        mockConn.query.mockResolvedValue([[]]);
        mockPool.query.mockResolvedValue([[]]);
        mockTo.mockReturnValue({ emit: mockEmit });
    });

    // ─── createAppointment ───────────────────────────────────────────────────
    describe('createAppointment', () => {
        const samplePayload = {
            clientId: 10,
            technicianId: 20,
            scheduledDate: '2026-10-25',
            scheduledTime: '15:00:00',
            description: 'Mantenimiento de PC',
            serviceLat: -12.046,
            serviceLng: -77.042,
            serviceAddress: 'Av. Brasil 123',
            serviceType: 'domicilio'
        };

        test('debería lanzar AppError 404 si el técnico/tienda no existe o no tiene rol tech/store', async () => {
            mockConn.query.mockResolvedValueOnce([[]]); // Destinatario no encontrado

            await expect(appointmentService.createAppointment(samplePayload)).rejects.toThrow(
                new AppError('El técnico o sucursal seleccionada no está disponible.', 404)
            );
            expect(mockConn.rollback).toHaveBeenCalled();
            expect(mockConn.release).toHaveBeenCalled();
        });

        test('debería lanzar AppError 400 si ya existe una cita activa entre el cliente y el técnico', async () => {
            mockConn.query.mockResolvedValueOnce([[{ id: 20, role: 'tech' }]]);
            appointmentRepo.findActiveForPair.mockResolvedValue({ id: 5 }); // Cita activa existente

            await expect(appointmentService.createAppointment(samplePayload)).rejects.toThrow(
                new AppError('Ya tienes una cita activa programada con este técnico o sucursal.', 400)
            );
            expect(mockConn.rollback).toHaveBeenCalled();
        });

        test('debería crear la cita con un técnico, insertar chat, emitir sockets y notificar', async () => {
            mockConn.query.mockResolvedValueOnce([[{ id: 20, role: 'tech' }]]);
            appointmentRepo.findActiveForPair.mockResolvedValue(null);
            appointmentRepo.create.mockResolvedValue(101);
            appointmentRepo.insertChatMessageConn.mockResolvedValue();
            notificationService.createNotification.mockResolvedValue(true);

            const result = await appointmentService.createAppointment(samplePayload);

            expect(mockConn.beginTransaction).toHaveBeenCalled();
            expect(appointmentRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    clientId: 10,
                    technicianId: 20,
                    scheduledDate: '2026-10-25'
                }),
                mockConn
            );
            expect(appointmentRepo.insertChatMessageConn).toHaveBeenCalledWith(
                mockConn,
                10,
                20,
                expect.stringContaining('Nueva Cita Agendada'),
                'appointment',
                101
            );
            expect(appointmentRepo.findStoreByUserId).not.toHaveBeenCalled();
            expect(mockConn.commit).toHaveBeenCalled();
            expect(mockConn.release).toHaveBeenCalled();

            // Socket.IO
            expect(mockTo).toHaveBeenCalledWith('user_20');
            expect(mockTo).toHaveBeenCalledWith('user_10');
            expect(mockEmit).toHaveBeenCalledWith('appointment_created', expect.objectContaining({
                appointment_id: 101,
                status: 'pending'
            }));

            // Notificación
            expect(notificationService.createNotification).toHaveBeenCalledWith(
                20,
                'Nueva Cita Recibida',
                expect.stringContaining('2026-10-25'),
                'appointment',
                { appointmentId: '101', type: 'new_appointment' }
            );

            expect(result).toEqual({ appointmentId: 101 });
        });

        test('debería vincular la sucursal si el destinatario tiene rol store', async () => {
            mockConn.query.mockResolvedValueOnce([[{ id: 30, role: 'store' }]]);
            appointmentRepo.findActiveForPair.mockResolvedValue(null);
            appointmentRepo.create.mockResolvedValue(102);
            appointmentRepo.insertChatMessageConn.mockResolvedValue();
            appointmentRepo.findStoreByUserId.mockResolvedValue({ id: 5 });
            appointmentRepo.linkStoreAppointment.mockResolvedValue();
            notificationService.createNotification.mockResolvedValue(true);

            const payloadStore = { ...samplePayload, technicianId: 30, serviceType: 'local' };
            const result = await appointmentService.createAppointment(payloadStore);

            expect(appointmentRepo.findStoreByUserId).toHaveBeenCalledWith(30, mockConn);
            expect(appointmentRepo.linkStoreAppointment).toHaveBeenCalledWith(5, 102, mockConn);
            expect(result).toEqual({ appointmentId: 102 });
        });

        test('no debería romper si Socket.IO lanza excepción (continúa normalmente)', async () => {
            mockConn.query.mockResolvedValueOnce([[{ id: 20, role: 'tech' }]]);
            appointmentRepo.findActiveForPair.mockResolvedValue(null);
            appointmentRepo.create.mockResolvedValue(103);
            appointmentRepo.insertChatMessageConn.mockResolvedValue();
            notificationService.createNotification.mockResolvedValue(true);

            getIO.mockImplementationOnce(() => {
                throw new Error('Socket not ready');
            });

            const result = await appointmentService.createAppointment(samplePayload);

            expect(mockConn.commit).toHaveBeenCalled();
            expect(result).toEqual({ appointmentId: 103 });
        });
    });

    // ─── getAppointments & getAppointmentById ─────────────────────────────────
    describe('getAppointments & getAppointmentById', () => {
        test('getAppointments expira citas antiguas y consulta las citas del usuario', async () => {
            const list = [{ id: 1, status: 'confirmed' }];
            appointmentRepo.expireOldAppointments.mockResolvedValue();
            appointmentRepo.findByUser.mockResolvedValue(list);

            const result = await appointmentService.getAppointments(10, 'confirmed');

            expect(appointmentRepo.expireOldAppointments).toHaveBeenCalled();
            expect(appointmentRepo.findByUser).toHaveBeenCalledWith(10, 'confirmed');
            expect(result).toEqual(list);
        });

        describe('getAppointmentById', () => {
            test('debería retornar el detalle si el usuario participa en la cita', async () => {
                const appt = { id: 1, client_id: 10, technician_id: 20 };
                appointmentRepo.findByIdForParticipant.mockResolvedValue(appt);

                const result = await appointmentService.getAppointmentById(1, 10);

                expect(appointmentRepo.findByIdForParticipant).toHaveBeenCalledWith(1, 10);
                expect(result).toEqual(appt);
            });

            test('debería lanzar AppError 404 si la cita no existe o el usuario no participa', async () => {
                appointmentRepo.findByIdForParticipant.mockResolvedValue(null);

                await expect(appointmentService.getAppointmentById(99, 10)).rejects.toThrow(
                    new AppError('No pudimos encontrar los detalles de la cita solicitada.', 404)
                );
            });
        });
    });

    // ─── updateAppointmentStatus (State Machine) ──────────────────────────────
    describe('updateAppointmentStatus', () => {
        test('debería lanzar AppError 404 si la cita no existe', async () => {
            appointmentRepo.findForRole.mockResolvedValue(null);

            await expect(
                appointmentService.updateAppointmentStatus(1, 10, 'client', 'confirmed')
            ).rejects.toThrow(new AppError('La cita no existe o ha sido eliminada.', 404));
        });

        test('debería lanzar AppError 403 si el usuario no es cliente, técnico ni admin', async () => {
            appointmentRepo.findForRole.mockResolvedValue({
                id: 1,
                client_id: 10,
                technician_id: 20,
                status: 'pending'
            });

            await expect(
                appointmentService.updateAppointmentStatus(1, 999, 'client', 'confirmed')
            ).rejects.toThrow(new AppError('No tienes permisos para realizar cambios en esta cita.', 403));
        });

        test('debería lanzar AppError 400 si la transición de estado no es válida', async () => {
            appointmentRepo.findForRole.mockResolvedValue({
                id: 1,
                client_id: 10,
                technician_id: 20,
                status: 'pending'
            });

            // De pending no se puede pasar directamente a completed
            await expect(
                appointmentService.updateAppointmentStatus(1, 20, 'tech', 'completed')
            ).rejects.toThrow(
                new AppError('No es posible realizar este cambio de estado en el momento actual.', 400)
            );
        });

        test('domicilio: lanza AppError 403 si el cliente intenta marcar on_the_way', async () => {
            appointmentRepo.findForRole.mockResolvedValue({
                id: 1,
                client_id: 10,
                technician_id: 20,
                status: 'confirmed',
                service_type: 'domicilio'
            });

            await expect(
                appointmentService.updateAppointmentStatus(1, 10, 'client', 'on_the_way')
            ).rejects.toThrow(
                new AppError('Solo el técnico puede marcar que está en camino al domicilio.', 403)
            );
        });

        test('en local: lanza AppError 403 si el técnico intenta marcar on_the_way', async () => {
            appointmentRepo.findForRole.mockResolvedValue({
                id: 1,
                client_id: 10,
                technician_id: 20,
                status: 'confirmed',
                service_type: 'local'
            });

            await expect(
                appointmentService.updateAppointmentStatus(1, 20, 'tech', 'on_the_way')
            ).rejects.toThrow(
                new AppError('Solo el cliente puede marcar que está en camino al local.', 403)
            );
        });

        test('lanza AppError 403 si el cliente intenta marcar in_progress', async () => {
            appointmentRepo.findForRole.mockResolvedValue({
                id: 1,
                client_id: 10,
                technician_id: 20,
                status: 'arrived',
                service_type: 'domicilio'
            });

            await expect(
                appointmentService.updateAppointmentStatus(1, 10, 'client', 'in_progress')
            ).rejects.toThrow(
                new AppError('Solo el prestador del servicio puede marcar este estado.', 403)
            );
        });

        test('técnico marca on_the_way a domicilio exitosamente, actualiza timestamp, chat, socket y notificación', async () => {
            appointmentRepo.findForRole.mockResolvedValue({
                id: 1,
                client_id: 10,
                technician_id: 20,
                status: 'confirmed',
                service_type: 'domicilio'
            });
            appointmentRepo.updateStatus.mockResolvedValue();
            appointmentRepo.insertChatMessage.mockResolvedValue();
            notificationService.createNotification.mockResolvedValue(true);

            await appointmentService.updateAppointmentStatus(1, 20, 'tech', 'on_the_way');

            expect(appointmentRepo.updateStatus).toHaveBeenCalledWith(1, 'on_the_way', 'en_camino_at');
            expect(appointmentRepo.insertChatMessage).toHaveBeenCalledWith(
                20,
                10,
                expect.stringContaining('El técnico está dirigiéndose a tu domicilio'),
                'appointment_progress',
                1
            );
            expect(mockEmit).toHaveBeenCalledWith('appointment_progress', expect.objectContaining({
                appointment_id: 1,
                status: 'on_the_way'
            }));
            expect(notificationService.createNotification).toHaveBeenCalledWith(
                10,
                'Actualización de Cita',
                expect.stringContaining('El técnico está dirigiéndose'),
                'appointment',
                { appointmentId: '1', nextStatus: 'on_the_way' }
            );
        });

        test('cliente en local marca arrived exitosamente', async () => {
            appointmentRepo.findForRole.mockResolvedValue({
                id: 1,
                client_id: 10,
                technician_id: 20,
                status: 'on_the_way',
                service_type: 'local'
            });
            appointmentRepo.updateStatus.mockResolvedValue();
            appointmentRepo.insertChatMessage.mockResolvedValue();
            notificationService.createNotification.mockResolvedValue(true);

            await appointmentService.updateAppointmentStatus(1, 10, 'client', 'arrived');

            expect(appointmentRepo.updateStatus).toHaveBeenCalledWith(1, 'arrived', 'llegado_at');
            expect(appointmentRepo.insertChatMessage).toHaveBeenCalledWith(
                10,
                20,
                expect.stringContaining('El cliente ya está en el local'),
                'appointment_progress',
                1
            );
        });

        test('admin puede actualizar status independientemente del rol del servicio', async () => {
            appointmentRepo.findForRole.mockResolvedValue({
                id: 1,
                client_id: 10,
                technician_id: 20,
                status: 'arrived',
                service_type: 'domicilio'
            });
            appointmentRepo.updateStatus.mockResolvedValue();
            appointmentRepo.insertChatMessage.mockResolvedValue();
            notificationService.createNotification.mockResolvedValue(true);

            await appointmentService.updateAppointmentStatus(1, 999, 'admin', 'in_progress');

            expect(appointmentRepo.updateStatus).toHaveBeenCalledWith(1, 'in_progress', 'en_progreso_at');
        });
    });

    // ─── cancelAppointment ───────────────────────────────────────────────────
    describe('cancelAppointment', () => {
        test('debería lanzar AppError 404 si la cita no existe', async () => {
            mockPool.query.mockResolvedValueOnce([[]]);

            await expect(appointmentService.cancelAppointment(1, 10)).rejects.toThrow(
                new AppError('Cita no encontrada.', 404)
            );
        });

        test('debería lanzar AppError 400 si la cita ya fue pagada', async () => {
            mockPool.query.mockResolvedValueOnce([[
                { id: 1, payment_status: 'paid', role: 'tech', technician_id: 20 }
            ]]);

            await expect(appointmentService.cancelAppointment(1, 10)).rejects.toThrow(
                new AppError('Las citas que ya han sido pagadas no pueden ser canceladas.', 400)
            );
        });

        test('si la cita es con tienda, está confirmed y quien cancela es el cliente -> pasa a cancellation_pending', async () => {
            mockPool.query.mockResolvedValueOnce([[
                { id: 1, status: 'confirmed', role: 'store', technician_id: 50, payment_status: 'pending' }
            ]]);
            appointmentRepo.setCancelledStatus.mockResolvedValue(1);

            const result = await appointmentService.cancelAppointment(1, 10);

            expect(appointmentRepo.setCancelledStatus).toHaveBeenCalledWith(1, 'cancellation_pending', 10);
            expect(result).toBe('cancellation_pending');
        });

        test('cancelación directa -> pasa a cancelled', async () => {
            mockPool.query.mockResolvedValueOnce([[
                { id: 1, status: 'pending', role: 'tech', technician_id: 20, payment_status: 'pending' }
            ]]);
            appointmentRepo.setCancelledStatus.mockResolvedValue(1);

            const result = await appointmentService.cancelAppointment(1, 10);

            expect(appointmentRepo.setCancelledStatus).toHaveBeenCalledWith(1, 'cancelled', 10);
            expect(result).toBe('cancelled');
        });

        test('debería lanzar AppError 404 si affected === 0 al cancelar', async () => {
            mockPool.query.mockResolvedValueOnce([[
                { id: 1, status: 'pending', role: 'tech', technician_id: 20, payment_status: 'pending' }
            ]]);
            appointmentRepo.setCancelledStatus.mockResolvedValue(0);

            await expect(appointmentService.cancelAppointment(1, 10)).rejects.toThrow(
                new AppError('Error al cancelar la cita o no autorizada.', 404)
            );
        });
    });

    // ─── setAppointmentPrice ─────────────────────────────────────────────────
    describe('setAppointmentPrice', () => {
        test('debería lanzar AppError 404 si la cita no existe', async () => {
            appointmentRepo.findForRole.mockResolvedValue(null);

            await expect(appointmentService.setAppointmentPrice(1, 20, 80)).rejects.toThrow(
                new AppError('Cita no encontrada.', 404)
            );
        });

        test('debería lanzar AppError 403 si quien fija precio no es el prestador del servicio', async () => {
            appointmentRepo.findForRole.mockResolvedValue({
                id: 1,
                technician_id: 20,
                client_id: 10
            });

            await expect(appointmentService.setAppointmentPrice(1, 10, 80)).rejects.toThrow(
                new AppError('Solo el prestador del servicio puede establecer el precio.', 403)
            );
        });

        test('debería lanzar AppError 400 si la cita ya está pagada', async () => {
            appointmentRepo.findForRole.mockResolvedValue({
                id: 1,
                technician_id: 20,
                client_id: 10,
                payment_status: 'paid'
            });

            await expect(appointmentService.setAppointmentPrice(1, 20, 80)).rejects.toThrow(
                new AppError('No se puede cambiar el precio de una cita ya pagada.', 400)
            );
        });

        test('debería fijar el precio, insertar mensaje de chat, emitir sockets y notificar al cliente', async () => {
            appointmentRepo.findForRole.mockResolvedValue({
                id: 1,
                technician_id: 20,
                client_id: 10,
                payment_status: 'pending'
            });
            appointmentRepo.setPrice.mockResolvedValue();
            appointmentRepo.insertChatMessage.mockResolvedValue();
            notificationService.createNotification.mockResolvedValue(true);

            await appointmentService.setAppointmentPrice(1, 20, '120.00');

            expect(appointmentRepo.setPrice).toHaveBeenCalledWith(1, '120.00');
            expect(appointmentRepo.insertChatMessage).toHaveBeenCalledWith(
                20,
                10,
                expect.stringContaining('S/ 120.00'),
                'appointment',
                1
            );
            expect(mockEmit).toHaveBeenCalledWith('appointment_price_updated', {
                appointment_id: 1,
                price: 120
            });
            expect(notificationService.createNotification).toHaveBeenCalledWith(
                10,
                'Precio Establecido',
                expect.stringContaining('S/ 120.00'),
                'appointment',
                { appointmentId: '1', price: '120.00' }
            );
        });
    });

    // ─── payAppointment ──────────────────────────────────────────────────────
    describe('payAppointment', () => {
        test('debería lanzar AppError 404 si la cita no existe', async () => {
            appointmentRepo.findForRole.mockResolvedValue(null);

            await expect(appointmentService.payAppointment(1, 10, 'yape')).rejects.toThrow(
                new AppError('Cita no encontrada.', 404)
            );
        });

        test('debería lanzar AppError 403 si quien intenta pagar no es el cliente', async () => {
            appointmentRepo.findForRole.mockResolvedValue({
                id: 1,
                client_id: 10,
                technician_id: 20
            });

            await expect(appointmentService.payAppointment(1, 20, 'yape')).rejects.toThrow(
                new AppError('Solo el cliente puede pagar la cita.', 403)
            );
        });

        test('debería lanzar AppError 400 si la cita aún no tiene precio establecido', async () => {
            appointmentRepo.findForRole.mockResolvedValue({
                id: 1,
                client_id: 10,
                technician_id: 20
            });
            appointmentRepo.findById.mockResolvedValue({ id: 1, price: null });

            await expect(appointmentService.payAppointment(1, 10, 'yape')).rejects.toThrow(
                new AppError('El prestador aún no ha establecido un precio para esta cita.', 400)
            );
        });

        test('debería registrar el pago en espera, emitir sockets y notificar al técnico', async () => {
            appointmentRepo.findForRole.mockResolvedValue({
                id: 1,
                client_id: 10,
                technician_id: 20
            });
            appointmentRepo.findById.mockResolvedValue({ id: 1, price: '85.00' });
            appointmentRepo.setPaymentWaiting.mockResolvedValue();
            notificationService.createNotification.mockResolvedValue(true);

            await appointmentService.payAppointment(1, 10, 'plin');

            expect(appointmentRepo.setPaymentWaiting).toHaveBeenCalledWith(1, 'plin');
            expect(mockEmit).toHaveBeenCalledWith('appointment_payment_waiting', {
                appointment_id: 1,
                payment_status: 'waiting_confirmation',
                payment_method: 'plin'
            });
            expect(notificationService.createNotification).toHaveBeenCalledWith(
                20,
                'Pago de Cita Notificado',
                expect.stringContaining('PLIN'),
                'appointment',
                { appointmentId: '1', action: 'payment_notified' }
            );
        });
    });

    // ─── confirmPayment ──────────────────────────────────────────────────────
    describe('confirmPayment', () => {
        test('debería lanzar AppError 404 si la cita no existe', async () => {
            appointmentRepo.findForRole.mockResolvedValue(null);

            await expect(appointmentService.confirmPayment(1, 20)).rejects.toThrow(
                new AppError('Cita no encontrada.', 404)
            );
        });

        test('debería lanzar AppError 403 si quien confirma no es el técnico', async () => {
            appointmentRepo.findForRole.mockResolvedValue({
                id: 1,
                client_id: 10,
                technician_id: 20
            });

            await expect(appointmentService.confirmPayment(1, 10)).rejects.toThrow(
                new AppError('Solo el prestador del servicio puede confirmar el pago.', 403)
            );
        });

        test('debería confirmar el pago, enviar chat, emitir sockets y notificar al cliente', async () => {
            appointmentRepo.findForRole.mockResolvedValue({
                id: 1,
                client_id: 10,
                technician_id: 20
            });
            appointmentRepo.confirmPayment.mockResolvedValue();
            appointmentRepo.insertChatMessage.mockResolvedValue();
            notificationService.createNotification.mockResolvedValue(true);

            await appointmentService.confirmPayment(1, 20);

            expect(appointmentRepo.confirmPayment).toHaveBeenCalledWith(1);
            expect(appointmentRepo.insertChatMessage).toHaveBeenCalledWith(
                20,
                10,
                expect.stringContaining('Pago Confirmado'),
                'appointment',
                1
            );
            expect(mockEmit).toHaveBeenCalledWith('appointment_payment_confirmed', {
                appointment_id: 1,
                payment_status: 'paid',
                status: 'confirmed'
            });
            expect(notificationService.createNotification).toHaveBeenCalledWith(
                10,
                'Pago Confirmado',
                expect.stringContaining('Tu pago ha sido validado'),
                'appointment',
                { appointmentId: '1', action: 'payment_confirmed' }
            );
        });
    });

    // ─── confirmCompletion ───────────────────────────────────────────────────
    describe('confirmCompletion', () => {
        test('debería lanzar AppError 404 si la cita no existe', async () => {
            appointmentRepo.findForRole.mockResolvedValue(null);

            await expect(appointmentService.confirmCompletion(1, 10)).rejects.toThrow(
                new AppError('Cita no encontrada.', 404)
            );
        });

        test('debería lanzar AppError 403 si quien confirma finalización no es el cliente', async () => {
            appointmentRepo.findForRole.mockResolvedValue({
                id: 1,
                client_id: 10,
                technician_id: 20,
                status: 'completed'
            });

            await expect(appointmentService.confirmCompletion(1, 20)).rejects.toThrow(
                new AppError('Solo el cliente puede confirmar la finalización del trabajo.', 403)
            );
        });

        test('debería lanzar AppError 400 si el técnico aún no ha marcado la cita como completed', async () => {
            appointmentRepo.findForRole.mockResolvedValue({
                id: 1,
                client_id: 10,
                technician_id: 20,
                status: 'in_progress'
            });

            await expect(appointmentService.confirmCompletion(1, 10)).rejects.toThrow(
                new AppError('El trabajo aún no ha sido marcado como completado por el técnico.', 400)
            );
        });

        test('debería confirmar la finalización y notificar al técnico', async () => {
            appointmentRepo.findForRole.mockResolvedValue({
                id: 1,
                client_id: 10,
                technician_id: 20,
                status: 'completed'
            });
            appointmentRepo.confirmCompletion.mockResolvedValue();
            notificationService.createNotification.mockResolvedValue(true);

            await appointmentService.confirmCompletion(1, 10);

            expect(appointmentRepo.confirmCompletion).toHaveBeenCalledWith(1);
            expect(notificationService.createNotification).toHaveBeenCalledWith(
                20,
                'Trabajo Confirmado',
                'El cliente ha confirmado la finalización exitosa del trabajo.',
                'appointment',
                { appointmentId: '1', action: 'completion_confirmed' }
            );
        });
    });
});
