/**
 * Tests de integración para payment.repository.js.
 *
 * Estrategia:
 *  - Usa la BD de pruebas (servicio_tecnico_test).
 *  - beforeEach trunca las tablas y re-siembra los fixtures base.
 *  - Valida inserción de logs de pago para citas y órdenes, valores por defecto y resiliencia.
 */
const repositoryPayment = require('../../../repository/payment.repository');
const seed = require('../../setup/seed');
const { pool } = require('../../../config/database');

let ids;

beforeEach(async () => {
    ids = await seed.run({ withProfiles: true });
});

afterAll(async () => {
    try {
        await seed.clear();
    } catch (_) { /* noop */ }
});

describe('payment.repository - logPayment', () => {
    test('debería registrar un log de pago exitoso para una cita', async () => {
        await repositoryPayment.logPayment({
            type: 'appointment',
            entityId: 10,
            method: 'culqi',
            chargeId: 'chr_test_123',
            amount: 75.50,
            status: 'success',
            raw: { id: 'chr_test_123', outcome: { type: 'venta_exitosa' } },
        });

        const [rows] = await pool.query(
            'SELECT * FROM payment_logs WHERE culqi_charge_id = ?',
            ['chr_test_123']
        );

        expect(rows).toHaveLength(1);
        const log = rows[0];
        expect(log.entity_type).toBe('appointment');
        expect(log.entity_id).toBe(10);
        expect(log.payment_method).toBe('culqi');
        expect(log.culqi_charge_id).toBe('chr_test_123');
        expect(Number(log.amount)).toBe(75.50);
        expect(log.currency).toBe('PEN');
        expect(log.status).toBe('success');
        expect(log.error_message).toBeNull();

        const rawData = typeof log.raw_response === 'string'
            ? JSON.parse(log.raw_response)
            : log.raw_response;
        expect(rawData.id).toBe('chr_test_123');
    });

    test('debería registrar un pago fallido con su mensaje de error', async () => {
        await repositoryPayment.logPayment({
            type: 'appointment',
            entityId: 20,
            method: 'culqi',
            chargeId: 'chr_failed_456',
            amount: 120.00,
            status: 'failed',
            error: 'Tarjeta denegada o fondos insuficientes',
            raw: { user_message: 'Tarjeta denegada' },
        });

        const [rows] = await pool.query(
            'SELECT * FROM payment_logs WHERE culqi_charge_id = ?',
            ['chr_failed_456']
        );

        expect(rows).toHaveLength(1);
        const log = rows[0];
        expect(log.status).toBe('failed');
        expect(log.error_message).toBe('Tarjeta denegada o fondos insuficientes');
        expect(Number(log.amount)).toBe(120.00);
    });

    test('debería registrar un pago para una orden de tienda (entity_type = order)', async () => {
        await repositoryPayment.logPayment({
            type: 'order',
            entityId: 5,
            method: 'culqi',
            chargeId: 'chr_order_789',
            amount: 250.00,
            status: 'success',
            raw: { orderId: 5 },
        });

        const [rows] = await pool.query(
            'SELECT * FROM payment_logs WHERE entity_type = "order" AND entity_id = 5'
        );

        expect(rows).toHaveLength(1);
        expect(rows[0].entity_type).toBe('order');
        expect(Number(rows[0].amount)).toBe(250.00);
        expect(rows[0].status).toBe('success');
    });

    test('debería usar método "culqi" por defecto cuando no se especifica method', async () => {
        await repositoryPayment.logPayment({
            type: 'appointment',
            entityId: 30,
            amount: 45.00,
            status: 'success',
        });

        const [rows] = await pool.query(
            'SELECT * FROM payment_logs WHERE entity_id = 30'
        );

        expect(rows).toHaveLength(1);
        expect(rows[0].payment_method).toBe('culqi');
        expect(rows[0].culqi_charge_id).toBeNull();
        expect(rows[0].error_message).toBeNull();
    });

    test('debería manejar errores de BD de forma resiliente sin romper la ejecución', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        // entity_type no puede ser null en la BD según el schema (NOT NULL)
        await expect(
            repositoryPayment.logPayment({
                type: null,
                entityId: 99,
                amount: 10,
                status: 'failed',
            })
        ).resolves.not.toThrow();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('[payment.repository] Error saving payment log:'),
            expect.any(String)
        );

        consoleErrorSpy.mockRestore();
    });
});
