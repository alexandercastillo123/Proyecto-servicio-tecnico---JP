/**
 * culqi.endpoint.test.js
 * Pruebas de integración de endpoints para /api/culqi usando Supertest
 */

jest.mock('../../services/culqi.service');

const culqiService = require('../../services/culqi.service');
const AppError = require('../../utils/AppError');
const { request, app, clientToken, authHeader } = require('../setup/endpoint-helper');

describe('Endpoints: /api/culqi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/culqi/public-key', () => {
        test('debería retornar 200 y la clave pública de Culqi', async () => {
            culqiService.getPublicKey.mockReturnValue('pk_test_123456');

            const res = await request(app).get('/api/culqi/public-key');

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual({ publicKey: 'pk_test_123456' });
        });
    });

    describe('POST /api/culqi/pay-appointment/:id', () => {
        test('debería retornar 401 si no está autenticado', async () => {
            const res = await request(app)
                .post('/api/culqi/pay-appointment/1')
                .send({ culqiToken: 'tkn_test_123' });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        test('debería retornar 200 al pagar la cita exitosamente con Culqi', async () => {
            culqiService.payAppointmentCulqi.mockResolvedValue({ chargeId: 'chr_app_123' });

            const res = await request(app)
                .post('/api/culqi/pay-appointment/1')
                .set(authHeader(clientToken))
                .send({ culqiToken: 'tkn_test_123' });

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual({ chargeId: 'chr_app_123' });
            expect(culqiService.payAppointmentCulqi).toHaveBeenCalledWith('1', 10, 'tkn_test_123');
        });

        test('debería retornar 402 si el pago es denegado por Culqi', async () => {
            culqiService.payAppointmentCulqi.mockRejectedValue(
                new AppError('Tarjeta rechazada por fondos insuficientes', 402)
            );

            const res = await request(app)
                .post('/api/culqi/pay-appointment/1')
                .set(authHeader(clientToken))
                .send({ culqiToken: 'tkn_fail' });

            expect(res.status).toBe(402);
            expect(res.body.exito).toBe(false);
            expect(res.body.mensaje).toBe('Tarjeta rechazada por fondos insuficientes');
        });
    });

    describe('POST /api/culqi/pay-order/:id', () => {
        test('debería retornar 401 si no está autenticado', async () => {
            const res = await request(app)
                .post('/api/culqi/pay-order/5')
                .send({ culqiToken: 'tkn_test_order' });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        test('debería retornar 200 al pagar la orden con Culqi exitosamente', async () => {
            culqiService.payOrderCulqi.mockResolvedValue({ chargeId: 'chr_ord_789' });

            const res = await request(app)
                .post('/api/culqi/pay-order/5')
                .set(authHeader(clientToken))
                .send({ culqiToken: 'tkn_test_order' });

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual({ chargeId: 'chr_ord_789' });
            expect(culqiService.payOrderCulqi).toHaveBeenCalledWith('5', 10, 'tkn_test_order');
        });
    });

    describe('POST /api/culqi/webhook', () => {
        test('debería retornar 200 al recibir un webhook procesado correctamente', async () => {
            culqiService.handleWebhook.mockResolvedValue({ received: true, chargeId: 'chr_1', status: 'success' });

            const res = await request(app)
                .post('/api/culqi/webhook')
                .set('Content-Type', 'application/json')
                .send({ type: 'charge.success', data: { id: 'chr_1' } });

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(culqiService.handleWebhook).toHaveBeenCalled();
        });

        test('debería retornar 401 si la firma del webhook es inválida', async () => {
            culqiService.handleWebhook.mockRejectedValue(
                new AppError('Firma de webhook Culqi inválida', 401)
            );

            const res = await request(app)
                .post('/api/culqi/webhook')
                .set('Content-Type', 'application/json')
                .send({ type: 'charge.success' });

            expect(res.status).toBe(401);
            expect(res.body.exito).toBe(false);
        });
    });
});
