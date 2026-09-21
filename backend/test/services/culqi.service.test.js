/**
 * culqi.service.test.js
 * Pruebas unitarias para culqi.service.js
 */

jest.mock('axios');
jest.mock('../../repository/appointment.repository');
jest.mock('../../repository/sucursal.repository');
jest.mock('../../repository/payment.repository');
jest.mock('../../utils/email.service');

const axios = require('axios');
const appointmentRepo = require('../../repository/appointment.repository');
const sucursalRepo = require('../../repository/sucursal.repository');
const paymentRepo = require('../../repository/payment.repository');
const { sendPaymentConfirmation } = require('../../utils/email.service');
const culqiService = require('../../services/culqi.service');
const AppError = require('../../utils/AppError');

describe('culqi.service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getPublicKey', () => {
        test('debería retornar la clave pública configurada', () => {
            const key = culqiService.getPublicKey();
            expect(typeof key).toBe('string');
            expect(key.length).toBeGreaterThan(0);
        });
    });

    describe('payAppointmentCulqi', () => {
        const mockAppointment = {
            id: 10,
            client_id: 1,
            technician_id: 5,
            price: '85.50',
            email: 'cliente@test.com',
            payment_status: 'pending'
        };

        test('debería lanzar AppError 400 si falta el token de Culqi', async () => {
            await expect(culqiService.payAppointmentCulqi(10, 1, null)).rejects.toThrow(
                new AppError('Token de Culqi requerido.', 400)
            );
        });

        test('debería lanzar AppError 404 si la cita no existe', async () => {
            appointmentRepo.findWithClientEmail.mockResolvedValue(null);

            await expect(culqiService.payAppointmentCulqi(99, 1, 'tkn_test_123')).rejects.toThrow(
                new AppError('Cita no encontrada.', 404)
            );
        });

        test('debería lanzar AppError 403 si el usuario autenticado no es el cliente de la cita', async () => {
            appointmentRepo.findWithClientEmail.mockResolvedValue(mockAppointment);

            await expect(culqiService.payAppointmentCulqi(10, 999, 'tkn_test_123')).rejects.toThrow(
                new AppError('Solo el cliente puede pagar esta cita.', 403)
            );
        });

        test('debería lanzar AppError 400 si la cita no tiene precio establecido', async () => {
            appointmentRepo.findWithClientEmail.mockResolvedValue({
                ...mockAppointment,
                price: null
            });

            await expect(culqiService.payAppointmentCulqi(10, 1, 'tkn_test_123')).rejects.toThrow(
                new AppError('El técnico aún no ha establecido el precio.', 400)
            );
        });

        test('debería lanzar AppError 400 si la cita ya fue pagada', async () => {
            appointmentRepo.findWithClientEmail.mockResolvedValue({
                ...mockAppointment,
                payment_status: 'paid'
            });

            await expect(culqiService.payAppointmentCulqi(10, 1, 'tkn_test_123')).rejects.toThrow(
                new AppError('Esta cita ya fue pagada.', 400)
            );
        });

        test('debería registrar el fallo y lanzar 402 si la llamada a Culqi falla (error de red/API)', async () => {
            appointmentRepo.findWithClientEmail.mockResolvedValue(mockAppointment);
            axios.post.mockRejectedValue({
                message: 'Tarjeta declinada',
                response: { data: { user_message: 'Fondos insuficientes' } }
            });

            await expect(culqiService.payAppointmentCulqi(10, 1, 'tkn_test_fail')).rejects.toThrow(
                new AppError('Fondos insuficientes', 402)
            );
            expect(paymentRepo.logPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'appointment',
                    entityId: 10,
                    status: 'failed',
                    error: 'Fondos insuficientes'
                })
            );
        });

        test('debería registrar el rechazo y lanzar 402 si Culqi responde con venta no exitosa', async () => {
            appointmentRepo.findWithClientEmail.mockResolvedValue(mockAppointment);
            axios.post.mockResolvedValue({
                data: {
                    id: 'chr_test_rej',
                    object: 'charge',
                    outcome: { type: 'rechazada' },
                    user_message: 'Operación denegada por el banco emisor'
                }
            });

            await expect(culqiService.payAppointmentCulqi(10, 1, 'tkn_test_rej')).rejects.toThrow(
                new AppError('Operación denegada por el banco emisor', 402)
            );
            expect(paymentRepo.logPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'appointment',
                    entityId: 10,
                    status: 'rejected'
                })
            );
        });

        test('debería procesar el pago exitosamente, confirmar cita, enviar mensaje y correo', async () => {
            appointmentRepo.findWithClientEmail.mockResolvedValue(mockAppointment);
            axios.post.mockResolvedValue({
                data: {
                    id: 'chr_test_ok_123',
                    object: 'charge',
                    outcome: { type: 'venta_exitosa' }
                }
            });

            const result = await culqiService.payAppointmentCulqi(10, 1, 'tkn_test_ok');

            expect(result).toEqual({ chargeId: 'chr_test_ok_123' });
            expect(appointmentRepo.confirmPaymentCulqi).toHaveBeenCalledWith(10, 'chr_test_ok_123');
            expect(appointmentRepo.insertChatMessage).toHaveBeenCalledWith(
                1,
                mockAppointment.technician_id,
                expect.stringContaining('¡Pago con Culqi confirmado!'),
                'appointment',
                10
            );
            expect(sendPaymentConfirmation).toHaveBeenCalledWith(
                'cliente@test.com',
                expect.objectContaining({
                    type: 'appointment',
                    id: 10,
                    amount: '85.50'
                })
            );
            expect(paymentRepo.logPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'appointment',
                    entityId: 10,
                    chargeId: 'chr_test_ok_123',
                    status: 'success'
                })
            );
        });
    });

    describe('payOrderCulqi', () => {
        const mockOrder = {
            id: 50,
            client_id: 1,
            sucursal_id: 2,
            store_user_id: 8,
            product_name: 'Batería iPhone 11',
            quantity: 1,
            total_price: '120.00',
            email: 'cliente@test.com',
            payment_status: 'pending'
        };

        test('debería lanzar AppError 400 si falta el token de Culqi', async () => {
            await expect(culqiService.payOrderCulqi(50, 1, null)).rejects.toThrow(
                new AppError('Token de Culqi requerido.', 400)
            );
        });

        test('debería lanzar AppError 404 si el pedido no existe', async () => {
            sucursalRepo.findOrderWithEmail.mockResolvedValue(null);

            await expect(culqiService.payOrderCulqi(999, 1, 'tkn_test')).rejects.toThrow(
                new AppError('Pedido no encontrado.', 404)
            );
        });

        test('debería lanzar AppError 403 si el usuario no es el dueño del pedido', async () => {
            sucursalRepo.findOrderWithEmail.mockResolvedValue(mockOrder);

            await expect(culqiService.payOrderCulqi(50, 999, 'tkn_test')).rejects.toThrow(
                new AppError('Solo el cliente puede pagar este pedido.', 403)
            );
        });

        test('debería lanzar AppError 400 si el pedido ya fue pagado', async () => {
            sucursalRepo.findOrderWithEmail.mockResolvedValue({
                ...mockOrder,
                payment_status: 'paid'
            });

            await expect(culqiService.payOrderCulqi(50, 1, 'tkn_test')).rejects.toThrow(
                new AppError('Este pedido ya fue pagado.', 400)
            );
        });

        test('debería registrar fallo y lanzar 402 si la llamada API de Culqi falla', async () => {
            sucursalRepo.findOrderWithEmail.mockResolvedValue(mockOrder);
            axios.post.mockRejectedValue(new Error('Network error'));

            await expect(culqiService.payOrderCulqi(50, 1, 'tkn_test')).rejects.toThrow(
                new AppError('Network error', 402)
            );
            expect(paymentRepo.logPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'order',
                    entityId: 50,
                    status: 'failed'
                })
            );
        });

        test('debería registrar rechazo y lanzar 402 si outcome no es exitoso', async () => {
            sucursalRepo.findOrderWithEmail.mockResolvedValue(mockOrder);
            axios.post.mockResolvedValue({
                data: {
                    id: 'chr_order_fail',
                    object: 'charge',
                    outcome: { type: 'rechazada' },
                    user_message: 'Tarjeta expirada'
                }
            });

            await expect(culqiService.payOrderCulqi(50, 1, 'tkn_test')).rejects.toThrow(
                new AppError('Tarjeta expirada', 402)
            );
            expect(paymentRepo.logPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'order',
                    entityId: 50,
                    status: 'rejected'
                })
            );
        });

        test('debería procesar el pago del pedido exitosamente', async () => {
            sucursalRepo.findOrderWithEmail.mockResolvedValue(mockOrder);
            axios.post.mockResolvedValue({
                data: {
                    id: 'chr_order_ok_999',
                    object: 'charge',
                    outcome: { type: 'venta_exitosa' }
                }
            });

            const result = await culqiService.payOrderCulqi(50, 1, 'tkn_order_ok');

            expect(result).toEqual({ chargeId: 'chr_order_ok_999' });
            expect(sucursalRepo.confirmOrderPaymentCulqi).toHaveBeenCalledWith(50, 'chr_order_ok_999');
            expect(sucursalRepo.insertOrderChatMessage).toHaveBeenCalledWith(
                1,
                mockOrder.store_user_id,
                expect.stringContaining('¡Pago con Culqi exitoso!'),
                50
            );
            expect(sendPaymentConfirmation).toHaveBeenCalledWith(
                'cliente@test.com',
                expect.objectContaining({
                    type: 'order',
                    id: 50,
                    itemName: 'Batería iPhone 11',
                    amount: '120.00'
                })
            );
            expect(paymentRepo.logPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'order',
                    entityId: 50,
                    chargeId: 'chr_order_ok_999',
                    status: 'success'
                })
            );
        });
    });

    describe('handleWebhook (idempotente)', () => {
        beforeEach(() => {
            paymentRepo.findByChargeId.mockResolvedValue(null);
            paymentRepo.logPayment.mockResolvedValue();
        });

        test('charge.success sin log previo registra log success', async () => {
            const payload = { type: 'charge.success', data: { id: 'chr_1', amount: 8550 } };
            const result = await culqiService.handleWebhook(
                JSON.stringify(payload), 'sig', '123', undefined
            );

            expect(result).toMatchObject({ chargeId: 'chr_1', status: 'success' });
            expect(paymentRepo.findByChargeId).toHaveBeenCalledWith('chr_1');
            expect(paymentRepo.logPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    chargeId: 'chr_1',
                    status: 'success',
                    type: 'appointment'
                })
            );
        });

        test('charge.failed registra log failed', async () => {
            const payload = { type: 'charge.failed', data: { id: 'chr_2', amount: 8550 } };
            await culqiService.handleWebhook(JSON.stringify(payload), 'sig', '123', undefined);

            expect(paymentRepo.logPayment).toHaveBeenCalledWith(
                expect.objectContaining({ chargeId: 'chr_2', status: 'failed' })
            );
        });

        test('no vuelve a registrar si ya fue procesado con éxito', async () => {
            paymentRepo.findByChargeId.mockResolvedValue({ entity_type: 'appointment', entity_id: 10, status: 'success' });
            const payload = { type: 'charge.failed', data: { id: 'chr_1' } };

            const result = await culqiService.handleWebhook(JSON.stringify(payload), 'sig', '123', undefined);

            expect(result).toMatchObject({ chargeId: 'chr_1', already: 'success' });
            expect(paymentRepo.updateStatusByCharge).not.toHaveBeenCalled();
            expect(paymentRepo.logPayment).not.toHaveBeenCalled();
        });
    });

    describe('Idempotencia en payAppointmentCulqi', () => {
        test('no debería cobrar dos veces la misma cita', async () => {
            appointmentRepo.findWithClientEmail.mockResolvedValue({
                id: 10, client_id: 1, technician_id: 5, price: '85.50',
                email: 'c@test.com', payment_status: 'pending'
            });
            paymentRepo.existsSuccessfulPayment.mockResolvedValue(true);

            await expect(culqiService.payAppointmentCulqi(10, 1, 'tkn_test')).rejects.toThrow(
                new AppError('Esta cita ya fue pagada.', 400)
            );
        });
    });
});
