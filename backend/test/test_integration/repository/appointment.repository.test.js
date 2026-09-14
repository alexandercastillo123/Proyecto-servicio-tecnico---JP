/**
 * Tests de integración para appointment.repository.js.
 *
 * Estrategia:
 *  - Usa la BD de pruebas (servicio_tecnico_test).
 *  - beforeEach trunca las tablas y re-siembra los fixtures base con perfiles.
 *  - Cubre operaciones de lectura, escritura, transiciones de estado de cita,
 *    pagos, confirmaciones, expiración automática (cron), recordatorios y vinculación con chat/sucursales.
 */
const repositoryAppointment = require('../../../repository/appointment.repository');
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

const createAppointmentHelper = async (overrides = {}) => {
    const conn = await pool.getConnection();
    try {
        const id = await repositoryAppointment.create(
            {
                clientId: ids.client,
                technicianId: ids.tech,
                scheduledDate: '2026-10-15',
                scheduledTime: '14:30:00',
                description: 'Reparación de placa madre',
                serviceLat: -12.046374,
                serviceLng: -77.042793,
                serviceAddress: 'Av. Arequipa 1234, Lima',
                serviceType: 'domicilio',
                ...overrides,
            },
            conn
        );
        return id;
    } finally {
        conn.release();
    }
};

describe('appointment.repository - Reads', () => {
    describe('findById', () => {
        test('debería devolver la cita completa con joins de perfiles de cliente y técnico', async () => {
            const apptId = await createAppointmentHelper();

            const appt = await repositoryAppointment.findById(apptId);

            expect(appt).not.toBeNull();
            expect(appt.id).toBe(apptId);
            expect(appt.status).toBe('pending');
            expect(appt.description).toBe('Reparación de placa madre');
            expect(appt.service_type).toBe('domicilio');
            expect(appt.service_address).toBe('Av. Arequipa 1234, Lima');
            expect(Number(appt.service_lat)).toBeCloseTo(-12.046374, 5);
            expect(Number(appt.service_lng)).toBeCloseTo(-77.042793, 5);

            // Datos del cliente traídos del JOIN
            expect(appt.client_id).toBe(ids.client);
            expect(appt.client_email).toBe('cliente@test.com');
            expect(appt.client_names).toBe('Juan');
            expect(appt.client_surnames).toBe('Pérez');
            expect(appt.client_phone).toBe('987654321');

            // Datos del técnico traídos del JOIN
            expect(appt.technician_id).toBe(ids.tech);
            expect(appt.tech_email).toBe('tecnico@test.com');
            expect(appt.tech_names).toBe('María');
            expect(appt.tech_surnames).toBe('García');
            expect(appt.tech_phone).toBe('999888777');
            expect(Number(appt.tech_rating)).toBe(4.8);
        });

        test('debería devolver null si el id de cita no existe', async () => {
            const appt = await repositoryAppointment.findById(999999);
            expect(appt).toBeNull();
        });
    });

    describe('findByIdForParticipant', () => {
        test('debería permitir acceso si el usuario es el cliente', async () => {
            const apptId = await createAppointmentHelper();
            const appt = await repositoryAppointment.findByIdForParticipant(apptId, ids.client);

            expect(appt).not.toBeNull();
            expect(appt.id).toBe(apptId);
        });

        test('debería permitir acceso si el usuario es el técnico', async () => {
            const apptId = await createAppointmentHelper();
            const appt = await repositoryAppointment.findByIdForParticipant(apptId, ids.tech);

            expect(appt).not.toBeNull();
            expect(appt.id).toBe(apptId);
        });

        test('debería devolver null si el usuario es un tercero no participante', async () => {
            const apptId = await createAppointmentHelper();
            const appt = await repositoryAppointment.findByIdForParticipant(apptId, ids.storeUser);

            expect(appt).toBeNull();
        });
    });

    describe('findByUser', () => {
        test('debería devolver las citas en las que participa el usuario como cliente o técnico', async () => {
            const apptId = await createAppointmentHelper();

            const clientList = await repositoryAppointment.findByUser(ids.client);
            const techList = await repositoryAppointment.findByUser(ids.tech);
            const otherList = await repositoryAppointment.findByUser(ids.storeUser);

            expect(clientList.some(a => a.id === apptId)).toBe(true);
            expect(techList.some(a => a.id === apptId)).toBe(true);
            expect(otherList.some(a => a.id === apptId)).toBe(false);
        });

        test('debería filtrar por status cuando se especifica', async () => {
            const appt1 = await createAppointmentHelper({ description: 'Cita 1' });
            const appt2 = await createAppointmentHelper({ description: 'Cita 2' });

            await repositoryAppointment.updateStatus(appt2, 'confirmed');

            const pendingList = await repositoryAppointment.findByUser(ids.client, 'pending');
            const confirmedList = await repositoryAppointment.findByUser(ids.client, 'confirmed');

            expect(pendingList.some(a => a.id === appt1)).toBe(true);
            expect(pendingList.some(a => a.id === appt2)).toBe(false);

            expect(confirmedList.some(a => a.id === appt1)).toBe(false);
            expect(confirmedList.some(a => a.id === appt2)).toBe(true);
        });
    });

    describe('findForRole', () => {
        test('debería devolver los datos básicos de rol y participantes', async () => {
            const apptId = await createAppointmentHelper();
            const roleData = await repositoryAppointment.findForRole(apptId);

            expect(roleData).not.toBeNull();
            expect(roleData.client_id).toBe(ids.client);
            expect(roleData.technician_id).toBe(ids.tech);
            expect(roleData.status).toBe('pending');
            expect(roleData.service_type).toBe('domicilio');
            expect(roleData.payment_status).toBe('pending');
            expect(roleData.cancelled_by).toBeNull();
        });

        test('debería devolver null para cita inexistente', async () => {
            const roleData = await repositoryAppointment.findForRole(999999);
            expect(roleData).toBeNull();
        });
    });

    describe('findActiveForPair', () => {
        test('debería devolver la cita activa futura entre cliente y técnico', async () => {
            // Cita programada para mañana
            const [r] = await pool.query(
                `INSERT INTO appointments (client_id, technician_id, scheduled_date, scheduled_time, status)
                 VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', 'pending')`,
                [ids.client, ids.tech]
            );
            const activeId = r.insertId;

            const found = await repositoryAppointment.findActiveForPair(ids.client, ids.tech);
            expect(found).not.toBeNull();
            expect(found.id).toBe(activeId);
        });

        test('debería devolver null si la cita entre ellos ya fue completada o cancelada', async () => {
            await pool.query(
                `INSERT INTO appointments (client_id, technician_id, scheduled_date, scheduled_time, status)
                 VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', 'completed')`,
                [ids.client, ids.tech]
            );

            const found = await repositoryAppointment.findActiveForPair(ids.client, ids.tech);
            expect(found).toBeNull();
        });
    });

    describe('findWithClientEmail', () => {
        test('debería devolver la cita unida al email del cliente', async () => {
            const apptId = await createAppointmentHelper();
            const row = await repositoryAppointment.findWithClientEmail(apptId);

            expect(row).not.toBeNull();
            expect(row.id).toBe(apptId);
            expect(row.email).toBe('cliente@test.com');
        });

        test('debería devolver null si la cita no existe', async () => {
            const row = await repositoryAppointment.findWithClientEmail(999999);
            expect(row).toBeNull();
        });
    });
});

describe('appointment.repository - Writes and Status Transitions', () => {
    describe('create', () => {
        test('debería crear una cita con estado inicial pending y valores por defecto', async () => {
            const conn = await pool.getConnection();
            try {
                const id = await repositoryAppointment.create(
                    {
                        clientId: ids.client,
                        technicianId: ids.tech,
                        scheduledDate: '2026-11-20',
                        scheduledTime: '09:00:00',
                        description: 'Diagnóstico general',
                    },
                    conn
                );

                expect(id).toBeGreaterThan(0);
                const [rows] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]);
                expect(rows[0].status).toBe('pending');
                expect(rows[0].service_type).toBe('local');
                expect(rows[0].service_lat).toBeNull();
            } finally {
                conn.release();
            }
        });
    });

    describe('updateStatus', () => {
        test('debería actualizar el estado de la cita', async () => {
            const apptId = await createAppointmentHelper();
            await repositoryAppointment.updateStatus(apptId, 'confirmed');

            const [rows] = await pool.query('SELECT status FROM appointments WHERE id = ?', [apptId]);
            expect(rows[0].status).toBe('confirmed');
        });

        test('debería actualizar el estado y registrar el timestamp correspondiente', async () => {
            const apptId = await createAppointmentHelper();
            await repositoryAppointment.updateStatus(apptId, 'on_the_way', 'en_camino_at');

            const [rows] = await pool.query('SELECT status, en_camino_at FROM appointments WHERE id = ?', [apptId]);
            expect(rows[0].status).toBe('on_the_way');
            expect(rows[0].en_camino_at).not.toBeNull();
        });
    });

    describe('setCancelledStatus', () => {
        test('debería permitir la cancelación por parte del cliente', async () => {
            const apptId = await createAppointmentHelper();
            const affected = await repositoryAppointment.setCancelledStatus(apptId, 'cancelled', ids.client);

            expect(affected).toBe(1);
            const [rows] = await pool.query('SELECT status, cancelled_by FROM appointments WHERE id = ?', [apptId]);
            expect(rows[0].status).toBe('cancelled');
            expect(rows[0].cancelled_by).toBe(ids.client);
        });

        test('debería permitir la cancelación por parte del técnico', async () => {
            const apptId = await createAppointmentHelper();
            const affected = await repositoryAppointment.setCancelledStatus(apptId, 'cancelled', ids.tech);

            expect(affected).toBe(1);
            const [rows] = await pool.query('SELECT status, cancelled_by FROM appointments WHERE id = ?', [apptId]);
            expect(rows[0].status).toBe('cancelled');
            expect(rows[0].cancelled_by).toBe(ids.tech);
        });

        test('debería denegar cancelación por un tercero devolviendo affectedRows = 0', async () => {
            const apptId = await createAppointmentHelper();
            const affected = await repositoryAppointment.setCancelledStatus(apptId, 'cancelled', ids.admin);

            expect(affected).toBe(0);
        });
    });

    describe('setPrice', () => {
        test('debería actualizar el precio de la cita', async () => {
            const apptId = await createAppointmentHelper();
            await repositoryAppointment.setPrice(apptId, 85.50);

            const [rows] = await pool.query('SELECT price FROM appointments WHERE id = ?', [apptId]);
            expect(Number(rows[0].price)).toBe(85.50);
        });
    });

    describe('setPaymentWaiting', () => {
        test('debería cambiar el método de pago y el estado a waiting_confirmation', async () => {
            const apptId = await createAppointmentHelper();
            await repositoryAppointment.setPaymentWaiting(apptId, 'yape');

            const [rows] = await pool.query(
                'SELECT payment_method, payment_status FROM appointments WHERE id = ?',
                [apptId]
            );
            expect(rows[0].payment_method).toBe('yape');
            expect(rows[0].payment_status).toBe('waiting_confirmation');
        });
    });

    describe('confirmPayment', () => {
        test('debería marcar el pago como paid y confirmar cita pending', async () => {
            const apptId = await createAppointmentHelper();
            await repositoryAppointment.confirmPayment(apptId);

            const [rows] = await pool.query(
                'SELECT payment_status, payment_confirmed_at, status FROM appointments WHERE id = ?',
                [apptId]
            );
            expect(rows[0].payment_status).toBe('paid');
            expect(rows[0].payment_confirmed_at).not.toBeNull();
            expect(rows[0].status).toBe('confirmed');
        });
    });

    describe('confirmPaymentCulqi', () => {
        test('debería registrar el cargo culqi, marcar paid y confirmar cita', async () => {
            const apptId = await createAppointmentHelper();
            await repositoryAppointment.confirmPaymentCulqi(apptId, 'chr_culqi_999');

            const [rows] = await pool.query(
                'SELECT payment_method, culqi_charge_id, payment_status, payment_confirmed_at, status FROM appointments WHERE id = ?',
                [apptId]
            );
            expect(rows[0].payment_method).toBe('culqi');
            expect(rows[0].culqi_charge_id).toBe('chr_culqi_999');
            expect(rows[0].payment_status).toBe('paid');
            expect(rows[0].payment_confirmed_at).not.toBeNull();
            expect(rows[0].status).toBe('confirmed');
        });
    });

    describe('confirmCompletion', () => {
        test('debería marcar la confirmación de finalización del cliente en true', async () => {
            const apptId = await createAppointmentHelper();
            await repositoryAppointment.confirmCompletion(apptId);

            const [rows] = await pool.query(
                'SELECT client_confirmed_completion FROM appointments WHERE id = ?',
                [apptId]
            );
            expect(rows[0].client_confirmed_completion).toBe(1);
        });
    });
});

describe('appointment.repository - Cron and Reminders', () => {
    describe('expireOldAppointments', () => {
        test('debería expirar citas pasadas pendientes o confirmadas', async () => {
            // Cita pasada (ayer) en estado pending
            await pool.query(
                `INSERT INTO appointments (client_id, technician_id, scheduled_date, scheduled_time, status)
                 VALUES (?, ?, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '10:00:00', 'pending')`,
                [ids.client, ids.tech]
            );
            // Cita futura (mañana) en estado pending
            await pool.query(
                `INSERT INTO appointments (client_id, technician_id, scheduled_date, scheduled_time, status)
                 VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', 'pending')`,
                [ids.client, ids.tech]
            );

            const affected = await repositoryAppointment.expireOldAppointments();
            expect(affected).toBeGreaterThanOrEqual(1);

            const [expiredRows] = await pool.query(
                'SELECT status FROM appointments WHERE scheduled_date < CURDATE()'
            );
            expect(expiredRows[0].status).toBe('expired');

            const [futureRows] = await pool.query(
                'SELECT status FROM appointments WHERE scheduled_date > CURDATE()'
            );
            expect(futureRows[0].status).toBe('pending');
        });
    });

    describe('findUpcomingForReminder', () => {
        test('debería encontrar citas confirmadas en los próximos 30 min para técnicos con recordatorios habilitados', async () => {
            await repositoryNotification.createDefaultSettings(ids.tech);

            // Cita para hoy dentro de 15 minutos
            const [r] = await pool.query(
                `INSERT INTO appointments (client_id, technician_id, scheduled_date, scheduled_time, status)
                 VALUES (?, ?, CURDATE(), ADDTIME(CURTIME(), '00:15:00'), 'confirmed')`,
                [ids.client, ids.tech]
            );
            const apptId = r.insertId;

            const upcoming = await repositoryAppointment.findUpcomingForReminder();
            const found = upcoming.find(a => a.id === apptId);

            expect(found).toBeDefined();
            expect(found.client_name).toBe('Juan');
            expect(found.tech_name).toBe('María');
        });

        test('NO debería incluir la cita si ya se envió un recordatorio en las últimas 12 horas', async () => {
            await repositoryNotification.createDefaultSettings(ids.tech);

            const [r] = await pool.query(
                `INSERT INTO appointments (client_id, technician_id, scheduled_date, scheduled_time, status)
                 VALUES (?, ?, CURDATE(), ADDTIME(CURTIME(), '00:15:00'), 'confirmed')`,
                [ids.client, ids.tech]
            );
            const apptId = r.insertId;

            // Insertar notificación de recordatorio previa para esta cita
            await repositoryAppointment.insertReminderNotification(
                ids.tech,
                'Recordatorio',
                `Recordatorio para la cita #${apptId}`
            );

            const upcoming = await repositoryAppointment.findUpcomingForReminder();
            const found = upcoming.find(a => a.id === apptId);
            expect(found).toBeUndefined();
        });
    });
});

describe('appointment.repository - Chat and Store Links', () => {
    describe('insertChatMessage e insertChatMessageConn', () => {
        test('debería insertar mensaje de chat usando el pool', async () => {
            const apptId = await createAppointmentHelper();
            await repositoryAppointment.insertChatMessage(
                ids.client,
                ids.tech,
                'Hola, estoy esperando su llegada',
                'text',
                apptId
            );

            const [rows] = await pool.query(
                'SELECT * FROM chat_messages WHERE appointment_id = ?',
                [apptId]
            );
            expect(rows).toHaveLength(1);
            expect(rows[0].sender_id).toBe(ids.client);
            expect(rows[0].receiver_id).toBe(ids.tech);
            expect(rows[0].message_text).toBe('Hola, estoy esperando su llegada');
        });

        test('debería insertar mensaje de chat usando una conexión transaccional', async () => {
            const apptId = await createAppointmentHelper();
            const conn = await pool.getConnection();
            try {
                await repositoryAppointment.insertChatMessageConn(
                    conn,
                    ids.tech,
                    ids.client,
                    'Ya estoy en camino',
                    'text',
                    apptId
                );
            } finally {
                conn.release();
            }

            const [rows] = await pool.query(
                'SELECT * FROM chat_messages WHERE appointment_id = ? AND sender_id = ?',
                [apptId, ids.tech]
            );
            expect(rows).toHaveLength(1);
            expect(rows[0].message_text).toBe('Ya estoy en camino');
        });
    });

    describe('findStoreByUserId y linkStoreAppointment', () => {
        test('debería encontrar la sucursal de un usuario de tipo tienda', async () => {
            const conn = await pool.getConnection();
            try {
                const store = await repositoryAppointment.findStoreByUserId(ids.storeUser, conn);
                expect(store).not.toBeNull();
                expect(store.id).toBeDefined();
            } finally {
                conn.release();
            }
        });

        test('debería vincular una cita con la sucursal en sucursales_citas', async () => {
            const apptId = await createAppointmentHelper();
            const conn = await pool.getConnection();
            try {
                const store = await repositoryAppointment.findStoreByUserId(ids.storeUser, conn);
                await repositoryAppointment.linkStoreAppointment(store.id, apptId, conn);
            } finally {
                conn.release();
            }

            const [rows] = await pool.query(
                'SELECT * FROM sucursales_citas WHERE cita_id = ?',
                [apptId]
            );
            expect(rows).toHaveLength(1);
        });
    });

    describe('insertReminderNotification', () => {
        test('debería insertar una notificación de recordatorio', async () => {
            await repositoryAppointment.insertReminderNotification(
                ids.tech,
                'Recordatorio de Cita',
                'Tienes una cita en breve'
            );

            const [rows] = await pool.query(
                'SELECT * FROM notifications WHERE user_id = ? AND type = "reminder"',
                [ids.tech]
            );
            expect(rows).toHaveLength(1);
            expect(rows[0].title).toBe('Recordatorio de Cita');
            expect(rows[0].message).toBe('Tienes una cita en breve');
        });
    });
});
