/**
 * notification.service.test.js
 * Pruebas unitarias para notification.service.js
 */

jest.mock('../../repository/notification.repository');
jest.mock('../../config/firebase');

const notificationRepo = require('../../repository/notification.repository');
const { sendPushNotification } = require('../../config/firebase');
const notificationService = require('../../services/notification.service');

describe('notification.service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore?.();
    });

    describe('createNotification', () => {
        test('debería insertar la notificación in-app y enviar push a todos los tokens cuando las preferencias lo permiten', async () => {
            const userId = 10;
            const notificationId = 99;
            notificationRepo.insert.mockResolvedValue(notificationId);
            notificationRepo.getSettingsForPush.mockResolvedValue({
                push_enabled: true,
                chat_notifications: true,
                appointment_reminders: true,
                order_updates: true
            });
            notificationRepo.getFCMTokens.mockResolvedValue([
                { fcm_token: 'token-device-1' },
                { fcm_token: 'token-device-2' }
            ]);
            sendPushNotification.mockResolvedValue({ success: true });

            const result = await notificationService.createNotification(
                userId,
                'Título de prueba',
                'Mensaje de prueba',
                'order',
                { extraKey: 'val' }
            );

            expect(result).toBe(true);
            expect(notificationRepo.insert).toHaveBeenCalledWith(
                userId,
                'Título de prueba',
                'Mensaje de prueba',
                'order',
                { extraKey: 'val' }
            );
            expect(notificationRepo.getSettingsForPush).toHaveBeenCalledWith(userId);
            expect(notificationRepo.getFCMTokens).toHaveBeenCalledWith(userId);
            expect(sendPushNotification).toHaveBeenCalledTimes(2);
            expect(sendPushNotification).toHaveBeenCalledWith(
                'token-device-1',
                'Título de prueba',
                'Mensaje de prueba',
                { extraKey: 'val', type: 'order', notificationId: '99' }
            );
            expect(sendPushNotification).toHaveBeenCalledWith(
                'token-device-2',
                'Título de prueba',
                'Mensaje de prueba',
                { extraKey: 'val', type: 'order', notificationId: '99' }
            );
        });

        test('no debería enviar push si push_enabled es false en la configuración', async () => {
            notificationRepo.insert.mockResolvedValue(100);
            notificationRepo.getSettingsForPush.mockResolvedValue({
                push_enabled: false
            });

            const result = await notificationService.createNotification(
                5,
                'Promo',
                'Mensaje',
                'general'
            );

            expect(result).toBe(true);
            expect(notificationRepo.insert).toHaveBeenCalled();
            expect(notificationRepo.getFCMTokens).not.toHaveBeenCalled();
            expect(sendPushNotification).not.toHaveBeenCalled();
        });

        test('no debería enviar push para type="chat" si chat_notifications está desactivado', async () => {
            notificationRepo.insert.mockResolvedValue(101);
            notificationRepo.getSettingsForPush.mockResolvedValue({
                push_enabled: true,
                chat_notifications: false
            });

            const result = await notificationService.createNotification(
                5,
                'Nuevo chat',
                'Hola',
                'chat'
            );

            expect(result).toBe(true);
            expect(notificationRepo.getFCMTokens).not.toHaveBeenCalled();
            expect(sendPushNotification).not.toHaveBeenCalled();
        });

        test('no debería enviar push para type="appointment" si appointment_reminders está desactivado', async () => {
            notificationRepo.insert.mockResolvedValue(102);
            notificationRepo.getSettingsForPush.mockResolvedValue({
                push_enabled: true,
                appointment_reminders: false
            });

            const result = await notificationService.createNotification(
                5,
                'Recordatorio',
                'Tu cita está lista',
                'appointment'
            );

            expect(result).toBe(true);
            expect(notificationRepo.getFCMTokens).not.toHaveBeenCalled();
            expect(sendPushNotification).not.toHaveBeenCalled();
        });

        test('no debería enviar push para type="offer" si appointment_reminders está desactivado', async () => {
            notificationRepo.insert.mockResolvedValue(103);
            notificationRepo.getSettingsForPush.mockResolvedValue({
                push_enabled: true,
                appointment_reminders: false
            });

            const result = await notificationService.createNotification(
                5,
                'Oferta especial',
                'Descuento',
                'offer'
            );

            expect(result).toBe(true);
            expect(sendPushNotification).not.toHaveBeenCalled();
        });

        test('no debería enviar push para type="order" si order_updates está desactivado', async () => {
            notificationRepo.insert.mockResolvedValue(104);
            notificationRepo.getSettingsForPush.mockResolvedValue({
                push_enabled: true,
                order_updates: false
            });

            const result = await notificationService.createNotification(
                5,
                'Pedido',
                'En camino',
                'order'
            );

            expect(result).toBe(true);
            expect(sendPushNotification).not.toHaveBeenCalled();
        });

        test('debería enviar push si settings es null (por defecto envía push)', async () => {
            notificationRepo.insert.mockResolvedValue(105);
            notificationRepo.getSettingsForPush.mockResolvedValue(null);
            notificationRepo.getFCMTokens.mockResolvedValue([{ fcm_token: 'token-xyz' }]);
            sendPushNotification.mockResolvedValue({});

            const result = await notificationService.createNotification(5, 'Aviso', 'Texto', 'chat');

            expect(result).toBe(true);
            expect(notificationRepo.getFCMTokens).toHaveBeenCalledWith(5);
            expect(sendPushNotification).toHaveBeenCalledWith('token-xyz', 'Aviso', 'Texto', {
                type: 'chat',
                notificationId: '105'
            });
        });

        test('no debería fallar ni llamar sendPushNotification si el usuario no tiene tokens FCM registrados', async () => {
            notificationRepo.insert.mockResolvedValue(106);
            notificationRepo.getSettingsForPush.mockResolvedValue(null);
            notificationRepo.getFCMTokens.mockResolvedValue([]);

            const result = await notificationService.createNotification(5, 'Aviso', 'Texto', 'order');

            expect(result).toBe(true);
            expect(sendPushNotification).not.toHaveBeenCalled();
        });

        test('debería retornar false y capturar el error si ocurre una excepción en el repositorio', async () => {
            notificationRepo.insert.mockRejectedValue(new Error('DB Connection Lost'));

            const result = await notificationService.createNotification(5, 'Aviso', 'Texto', 'order');

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('notifyOrderStatus', () => {
        test.each([
            ['confirmed', 'Pedido Confirmado: Tu pedido de "Laptop Dell" ha sido aceptado.'],
            ['shipped', 'Pedido en Camino: Tu pedido de "Laptop Dell" ya está en camino.'],
            ['delivered', 'Pedido Entregado: El pedido de "Laptop Dell" ha sido entregado.'],
            ['cancelled', 'Pedido Cancelado: Tu pedido de "Laptop Dell" ha sido cancelado.']
        ])('debería disparar la notificación con el mensaje apropiado para status="%s"', async (status, expectedMessage) => {
            notificationRepo.insert.mockResolvedValue(200);
            notificationRepo.getSettingsForPush.mockResolvedValue(null);
            notificationRepo.getFCMTokens.mockResolvedValue([]);

            const result = await notificationService.notifyOrderStatus(12, 55, status, 'Laptop Dell');

            expect(result).toBe(true);
            expect(notificationRepo.insert).toHaveBeenCalledWith(
                12,
                'Actualización de Pedido',
                expectedMessage,
                'order',
                { orderId: '55', status }
            );
        });

        test('debería retornar true inmediatamente si el status no está mapeado', async () => {
            const result = await notificationService.notifyOrderStatus(12, 55, 'unknown_status', 'Producto');

            expect(result).toBe(true);
            expect(notificationRepo.insert).not.toHaveBeenCalled();
        });
    });
});
