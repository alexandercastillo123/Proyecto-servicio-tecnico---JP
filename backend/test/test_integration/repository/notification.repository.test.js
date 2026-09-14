/**
 * Tests de integración para notification.repository.js.
 *
 * Estrategia:
 *  - Usa la BD de pruebas (servicio_tecnico_test).
 *  - beforeEach trunca las tablas y re-siembra los fixtures base.
 *  - Valida inserciones, consultas por usuario, lectura de notificaciones,
 *    configuración de notificaciones, tokens FCM y limpieza de códigos expirados.
 */
const repositoryNotification = require('../../../repository/notification.repository');
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

describe('notification.repository - Notifications', () => {
    describe('insert', () => {
        test('debería insertar una notificación y devolver su insertId', async () => {
            const notifId = await repositoryNotification.insert(
                ids.client,
                'Nueva Notificación',
                'Mensaje de prueba para cliente',
                'system'
            );

            expect(notifId).toBeGreaterThan(0);

            const [rows] = await pool.query(
                'SELECT * FROM notifications WHERE id = ?',
                [notifId]
            );

            expect(rows).toHaveLength(1);
            expect(rows[0].user_id).toBe(ids.client);
            expect(rows[0].title).toBe('Nueva Notificación');
            expect(rows[0].message).toBe('Mensaje de prueba para cliente');
            expect(rows[0].type).toBe('system');
            expect(rows[0].related_id).toBeNull();
            expect(rows[0].is_read).toBe(0);
        });

        test('debería extraer related_id cuando extraData contiene appointmentId u orderId', async () => {
            const idWithApp = await repositoryNotification.insert(
                ids.tech,
                'Cita Asignada',
                'Tienes una cita #101',
                'appointment',
                { appointmentId: 101 }
            );

            const idWithOrder = await repositoryNotification.insert(
                ids.client,
                'Pedido Actualizado',
                'Pedido #202 enviado',
                'order',
                { orderId: '202' }
            );

            const [appRows] = await pool.query('SELECT related_id FROM notifications WHERE id = ?', [idWithApp]);
            const [orderRows] = await pool.query('SELECT related_id FROM notifications WHERE id = ?', [idWithOrder]);

            expect(appRows[0].related_id).toBe(101);
            expect(orderRows[0].related_id).toBe(202);
        });

        test('debería aceptar related_id cuando extraData es un número directo', async () => {
            const notifId = await repositoryNotification.insert(
                ids.tech,
                'Aviso',
                'Mensaje directo',
                'chat',
                303
            );

            const [rows] = await pool.query('SELECT related_id FROM notifications WHERE id = ?', [notifId]);
            expect(rows[0].related_id).toBe(303);
        });
    });

    describe('findByUser', () => {
        test('debería listar notificaciones del usuario ordenadas descendentemente por fecha', async () => {
            await repositoryNotification.insert(ids.client, 'Notif 1', 'Primero', 'system');
            await repositoryNotification.insert(ids.client, 'Notif 2', 'Segundo', 'system');
            await repositoryNotification.insert(ids.tech, 'Notif Tech', 'Para técnico', 'system');

            const clientNotifs = await repositoryNotification.findByUser(ids.client);
            expect(clientNotifs.length).toBeGreaterThanOrEqual(2);

            // Verificar que no contenga las del técnico
            const hasTechNotif = clientNotifs.some(n => n.title === 'Notif Tech');
            expect(hasTechNotif).toBe(false);

            // Verificar orden descendente
            expect(clientNotifs[0].title).toBe('Notif 2');
            expect(clientNotifs[1].title).toBe('Notif 1');
        });

        test('debería respetar el límite proporcionado', async () => {
            for (let i = 1; i <= 5; i++) {
                await repositoryNotification.insert(ids.client, `Notif ${i}`, `Msg ${i}`, 'system');
            }

            const limited = await repositoryNotification.findByUser(ids.client, 3);
            expect(limited).toHaveLength(3);
        });

        test('debería devolver array vacío si el usuario no tiene notificaciones', async () => {
            const notifs = await repositoryNotification.findByUser(ids.admin);
            expect(notifs).toEqual([]);
        });
    });

    describe('markAsRead', () => {
        test('debería marcar la notificación como leída y devolver affectedRows = 1', async () => {
            const notifId = await repositoryNotification.insert(
                ids.client,
                'Por leer',
                'Contenido',
                'system'
            );

            const affected = await repositoryNotification.markAsRead(notifId, ids.client);
            expect(affected).toBe(1);

            const [rows] = await pool.query('SELECT is_read FROM notifications WHERE id = ?', [notifId]);
            expect(rows[0].is_read).toBe(1);
        });

        test('debería devolver affectedRows = 0 si la notificación no pertenece al usuario', async () => {
            const notifId = await repositoryNotification.insert(
                ids.client,
                'Del cliente',
                'Contenido',
                'system'
            );

            // Intento de marcar por otro usuario (tech)
            const affected = await repositoryNotification.markAsRead(notifId, ids.tech);
            expect(affected).toBe(0);

            const [rows] = await pool.query('SELECT is_read FROM notifications WHERE id = ?', [notifId]);
            expect(rows[0].is_read).toBe(0);
        });

        test('debería devolver affectedRows = 0 para id inexistente', async () => {
            const affected = await repositoryNotification.markAsRead(999999, ids.client);
            expect(affected).toBe(0);
        });
    });
});

describe('notification.repository - Settings', () => {
    describe('createDefaultSettings y getSettings', () => {
        test('debería devolver null si el usuario no tiene settings', async () => {
            const settings = await repositoryNotification.getSettings(ids.client);
            expect(settings).toBeNull();
        });

        test('debería crear configuración por defecto y poder consultarla', async () => {
            await repositoryNotification.createDefaultSettings(ids.client);
            const settings = await repositoryNotification.getSettings(ids.client);

            expect(settings).not.toBeNull();
            expect(settings.user_id).toBe(ids.client);
            expect(settings.push_enabled).toBe(1);
            expect(settings.appointment_reminders).toBe(1);
            expect(settings.chat_notifications).toBe(1);
            expect(settings.order_updates).toBe(1);
        });
    });

    describe('updateSettings', () => {
        test('debería actualizar campos de settings manteniendo los no enviados (COALESCE)', async () => {
            await repositoryNotification.createDefaultSettings(ids.client);

            await repositoryNotification.updateSettings(ids.client, {
                push_enabled: false,
                chat_notifications: false,
            });

            const settings = await repositoryNotification.getSettings(ids.client);
            expect(settings.push_enabled).toBe(0);
            expect(settings.chat_notifications).toBe(0);
            expect(settings.appointment_reminders).toBe(1);
            expect(settings.order_updates).toBe(1);
        });

        test('debería soportar tanto appointment_reminders como appointments_reminders', async () => {
            await repositoryNotification.createDefaultSettings(ids.tech);

            // Con nombre en plural (alias soportado)
            await repositoryNotification.updateSettings(ids.tech, {
                appointments_reminders: false,
            });

            let settings = await repositoryNotification.getSettings(ids.tech);
            expect(settings.appointment_reminders).toBe(0);

            // Con nombre estándar en singular
            await repositoryNotification.updateSettings(ids.tech, {
                appointment_reminders: true,
            });

            settings = await repositoryNotification.getSettings(ids.tech);
            expect(settings.appointment_reminders).toBe(1);
        });
    });

    describe('getSettingsForPush', () => {
        test('debería devolver los flags de preferencias requeridos para push', async () => {
            await repositoryNotification.createDefaultSettings(ids.admin);
            const pushSettings = await repositoryNotification.getSettingsForPush(ids.admin);

            expect(pushSettings).toEqual({
                push_enabled: 1,
                chat_notifications: 1,
                appointment_reminders: 1,
                order_updates: 1,
            });
        });

        test('debería devolver null si no existen settings para el usuario', async () => {
            const pushSettings = await repositoryNotification.getSettingsForPush(999999);
            expect(pushSettings).toBeNull();
        });
    });
});

describe('notification.repository - Device Tokens', () => {
    describe('saveToken y getFCMTokens', () => {
        test('debería registrar un token y poder consultarlo', async () => {
            await repositoryNotification.saveToken(ids.client, 'token_xyz_1', 'android');

            const tokens = await repositoryNotification.getFCMTokens(ids.client);
            expect(tokens).toHaveLength(1);
            expect(tokens[0].fcm_token).toBe('token_xyz_1');
        });

        test('debería actualizar usuario y plataforma si el token ya existe (ON DUPLICATE KEY)', async () => {
            await repositoryNotification.saveToken(ids.client, 'token_shared', 'android');
            // Mismo token ahora re-asignado a tech con plataforma ios
            await repositoryNotification.saveToken(ids.tech, 'token_shared', 'ios');

            const clientTokens = await repositoryNotification.getFCMTokens(ids.client);
            const techTokens = await repositoryNotification.getFCMTokens(ids.tech);

            expect(clientTokens).toHaveLength(0);
            expect(techTokens).toHaveLength(1);
            expect(techTokens[0].fcm_token).toBe('token_shared');
        });

        test('debería permitir múltiples tokens distintos para el mismo usuario', async () => {
            await repositoryNotification.saveToken(ids.tech, 'token_tech_phone', 'android');
            await repositoryNotification.saveToken(ids.tech, 'token_tech_tablet', 'ios');

            const tokens = await repositoryNotification.getFCMTokens(ids.tech);
            expect(tokens).toHaveLength(2);
        });
    });

    describe('removeToken', () => {
        test('debería eliminar un token específico del usuario', async () => {
            await repositoryNotification.saveToken(ids.client, 'tok_a', 'android');
            await repositoryNotification.saveToken(ids.client, 'tok_b', 'ios');

            await repositoryNotification.removeToken(ids.client, 'tok_a');

            const tokens = await repositoryNotification.getFCMTokens(ids.client);
            expect(tokens).toHaveLength(1);
            expect(tokens[0].fcm_token).toBe('tok_b');
        });

        test('no debería afectar tokens de otros usuarios si se intenta borrar un token que no le pertenece', async () => {
            await repositoryNotification.saveToken(ids.client, 'tok_client', 'android');

            // Tech intenta borrar el token del cliente
            await repositoryNotification.removeToken(ids.tech, 'tok_client');

            const tokens = await repositoryNotification.getFCMTokens(ids.client);
            expect(tokens).toHaveLength(1);
            expect(tokens[0].fcm_token).toBe('tok_client');
        });
    });
});

describe('notification.repository - Cleanup', () => {
    describe('deleteExpiredResets', () => {
        test('debería eliminar únicamente los códigos de reseteo expirados', async () => {
            // Insertar 1 expirado y 1 vigente
            await pool.query(
                'INSERT INTO password_resets (email, code, expires_at) VALUES (?, ?, DATE_SUB(NOW(), INTERVAL 5 MINUTE))',
                ['expirado@test.com', '111111']
            );
            await pool.query(
                'INSERT INTO password_resets (email, code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
                ['vigente@test.com', '222222']
            );

            const deletedCount = await repositoryNotification.deleteExpiredResets();
            expect(deletedCount).toBe(1);

            const [expiredRows] = await pool.query(
                'SELECT * FROM password_resets WHERE email = "expirado@test.com"'
            );
            const [validRows] = await pool.query(
                'SELECT * FROM password_resets WHERE email = "vigente@test.com"'
            );

            expect(expiredRows).toHaveLength(0);
            expect(validRows).toHaveLength(1);
            expect(validRows[0].code).toBe('222222');
        });
    });
});
