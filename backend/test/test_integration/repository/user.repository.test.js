/**
 * Tests de integración para user.repository.js.
 *
 * Estrategia:
 *  - Usa una BD de pruebas (servicio_tecnico_test) separada de la de desarrollo.
 *  - jest.config.js + globalSetup crean la BD y aplican el schema una sola vez.
 *  - beforeEach trunca las tablas y re-siembra los fixtures base.
 *  - Los IDs sembrados (admin/client/tech/storeUser) son los mismos en cada test.
 */
const repositoryUser = require('../../../repository/user.repository');
const seed = require('../../setup/seed');
const { pool } = require('../../../config/database');

let ids;

beforeEach(async () => {
    ids = await seed.run({ withProfiles: true });
});

afterAll(async () => {
    // Cierra conexiones abiertas; el pool se cierra en global-teardown.
    // Mantenemos la BD intacta entre runs para acelerar la suite.
    try {
        await seed.clear();
    } catch (_) { /* noop */ }
});

describe('user.repository - Users', () => {
    describe('findByEmail', () => {
        test('debería encontrar el admin por su email y devolver username', async () => {
            const row = await repositoryUser.findByEmail('admin@jyp.com');
            expect(row).not.toBeNull();
            expect(row.username).toBe('admin_jyp');
            expect(row.email).toBe('admin@jyp.com');
            expect(row.role).toBe('admin');
            expect(row.password_hash).toBeDefined();
        });

        test('debería devolver null si el email no existe', async () => {
            const row = await repositoryUser.findByEmail('noexiste@test.com');
            expect(row).toBeNull();
        });

        test('NO debería devolver password_hash en la firma... (sí lo devuelve actualmente, lo confirmamos)', async () => {
            // Documenta el comportamiento actual: password_hash sí viaja en findByEmail.
            const row = await repositoryUser.findByEmail('admin@jyp.com');
            expect(row.password_hash).toBeDefined();
        });
    });

    describe('findById', () => {
        test('debería unir users con user_profiles y traer el perfil completo', async () => {
            const row = await repositoryUser.findById(ids.tech);
            expect(row.id).toBe(ids.tech);
            expect(row.email).toBe('tecnico@test.com');
            expect(row.role).toBe('tech');
            expect(row.names).toBe('María');
            expect(row.surnames).toBe('García');
            expect(row.dni).toBe('87654321');
            expect(Number(row.rating)).toBe(4.8);
            expect(row.reviews_count).toBe(124);
        });

        test('debería devolver null para un id inexistente', async () => {
            const row = await repositoryUser.findById(999999);
            expect(row).toBeNull();
        });

        test('debería devolver el user aunque no tenga profile (LEFT JOIN)', async () => {
            // Insertar un user sin profile
            const [r] = await pool.query(
                'INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, ?)',
                ['sinperfil@test.com', 'sin_perfil', 'hash', 'client']
            );
            const row = await repositoryUser.findById(r.insertId);
            expect(row).not.toBeNull();
            expect(row.email).toBe('sinperfil@test.com');
            expect(row.names).toBeNull();
        });
    });

    describe('findPublicById', () => {
        test('debería devolver datos públicos incluyendo store_id para un user store', async () => {
            const row = await repositoryUser.findPublicById(ids.storeUser);
            expect(row.id).toBe(ids.storeUser);
            expect(row.username).toBe('tienda_test');
            expect(row.role).toBe('store');
            expect(row.company_name).toBe('Servicios Técnicos JP SAC');
            expect(row.ruc).toBe('20123456789');
            expect(row.store_id).toBeDefined();
            expect(Number(row.store_id)).toBeGreaterThan(0);
        });

        test('debería devolver store_id null para users sin sucursal', async () => {
            const row = await repositoryUser.findPublicById(ids.client);
            expect(row.store_id).toBeNull();
        });
    });

    describe('emailExists', () => {
        test('debería devolver true si el email existe', async () => {
            expect(await repositoryUser.emailExists('admin@jyp.com')).toBe(true);
        });

        test('debería devolver false si el email no existe', async () => {
            expect(await repositoryUser.emailExists('fantasma@test.com')).toBe(false);
        });
    });

    describe('usernameExists', () => {
        test('debería devolver true para un username existente', async () => {
            expect(await repositoryUser.usernameExists('admin_jyp')).toBe(true);
        });

        test('debería devolver false para un username inexistente', async () => {
            expect(await repositoryUser.usernameExists('no_existe_123')).toBe(false);
        });

        test('debería excluir el id del propio usuario cuando se pasa excludeId', async () => {
            expect(await repositoryUser.usernameExists('admin_jyp', ids.admin)).toBe(false);
            expect(await repositoryUser.usernameExists('admin_jyp', ids.client)).toBe(true);
        });
    });

    describe('dniOrRucExists', () => {
        test('debería encontrar por DNI', async () => {
            expect(await repositoryUser.dniOrRucExists('12345678', null)).toBe(true);
        });

        test('debería encontrar por RUC', async () => {
            expect(await repositoryUser.dniOrRucExists(null, '20123456789')).toBe(true);
        });

        test('debería devolver false cuando ninguno coincide', async () => {
            expect(await repositoryUser.dniOrRucExists('99999999', '99999999999')).toBe(false);
        });
    });

    describe('create', () => {
        test('debería crear un user y devolver su insertId', async () => {
            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();
                const id = await repositoryUser.create(
                    {
                        email: 'nuevo@test.com',
                        username: 'nuevo_user',
                        passwordHash: 'hash123',
                        role: 'client',
                        policiesAccepted: true,
                    },
                    conn
                );
                await conn.commit();
                expect(id).toBeGreaterThan(0);

                const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
                expect(rows[0].email).toBe('nuevo@test.com');
                expect(rows[0].policies_accepted).toBe(1);
            } catch (e) {
                await conn.rollback();
                throw e;
            } finally {
                conn.release();
            }
        });

        test('createBasic debería crear un user sin policies_accepted', async () => {
            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();
                const id = await repositoryUser.createBasic(
                    'basico@test.com',
                    'basico_user',
                    'hash',
                    'client',
                    conn
                );
                await conn.commit();
                const [rows] = await pool.query('SELECT policies_accepted FROM users WHERE id = ?', [id]);
                expect(rows[0].policies_accepted).toBe(0);
            } catch (e) {
                await conn.rollback();
                throw e;
            } finally {
                conn.release();
            }
        });
    });

    describe('updateUsername', () => {
        test('debería actualizar el username', async () => {
            await repositoryUser.updateUsername(ids.admin, 'admin_jyp_new');
            const row = await repositoryUser.findByEmail('admin@jyp.com');
            expect(row.username).toBe('admin_jyp_new');
        });
    });

    describe('updatePassword', () => {
        test('debería cambiar el password_hash y devolver affectedRows=1', async () => {
            const affected = await repositoryUser.updatePassword(ids.admin, 'NEW_HASH');
            expect(affected).toBe(1);
            const row = await repositoryUser.findByEmail('admin@jyp.com');
            expect(row.password_hash).toBe('NEW_HASH');
        });

        test('debería devolver 0 affectedRows si el user no existe', async () => {
            const affected = await repositoryUser.updatePassword(999999, 'X');
            expect(affected).toBe(0);
        });
    });

    describe('updatePasswordByEmail', () => {
        test('debería cambiar el password buscando por email', async () => {
            const affected = await repositoryUser.updatePasswordByEmail('cliente@test.com', 'CLIENT_HASH');
            expect(affected).toBe(1);
            const row = await repositoryUser.findByEmail('cliente@test.com');
            expect(row.password_hash).toBe('CLIENT_HASH');
        });
    });
});

describe('user.repository - Profiles', () => {
    describe('createProfile', () => {
        test('debería crear un profile completo dentro de una transacción', async () => {
            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();
                const userId = await repositoryUser.create(
                    {
                        email: 'conperfil@test.com',
                        username: 'con_perfil',
                        passwordHash: 'h',
                        role: 'client',
                        policiesAccepted: false,
                    },
                    conn
                );
                await repositoryUser.createProfile(
                    {
                        userId,
                        phone: '999000111',
                        address: 'Calle 1',
                        city: 'Lima',
                        personType: 'natural',
                        names: 'Test',
                        surnames: 'User',
                        dni: '11111111',
                        companyName: null,
                        ruc: null,
                        referenceAddress: null,
                        latitude: -12.0,
                        longitude: -77.0,
                    },
                    conn
                );
                await conn.commit();

                const profile = await repositoryUser.findById(userId);
                expect(profile.names).toBe('Test');
                expect(profile.dni).toBe('11111111');
            } catch (e) {
                await conn.rollback();
                throw e;
            } finally {
                conn.release();
            }
        });
    });

    describe('createBasicProfile', () => {
        test('debería crear un profile básico', async () => {
            const conn = await pool.getConnection();
            try {
                await conn.beginTransaction();
                const userId = await repositoryUser.createBasic(
                    'basic@test.com', 'basic_u', 'h', 'client', conn
                );
                await repositoryUser.createBasicProfile(
                    userId,
                    { phone: '111', address: 'Dir', city: 'Lima', personType: 'natural', names: 'N' },
                    conn
                );
                await conn.commit();

                const profile = await repositoryUser.findById(userId);
                expect(profile.names).toBe('N');
                expect(profile.phone).toBe('111');
            } catch (e) {
                await conn.rollback();
                throw e;
            } finally {
                conn.release();
            }
        });
    });

    describe('updateProfile', () => {
        test('debería actualizar solo los campos enviados (COALESCE)', async () => {
            await repositoryUser.updateProfile(ids.client, {
                names: 'Juan Modificado',
                city: 'Arequipa',
            });

            const row = await repositoryUser.findById(ids.client);
            expect(row.names).toBe('Juan Modificado');
            expect(row.city).toBe('Arequipa');
            // El resto se conserva
            expect(row.surnames).toBe('Pérez');
            expect(row.dni).toBe('12345678');
        });
    });

    describe('updateProfileImage', () => {
        test('debería actualizar la URL de la imagen', async () => {
            await repositoryUser.updateProfileImage(ids.admin, 'uploads/test.jpg');
            const row = await repositoryUser.findById(ids.admin);
            expect(row.profile_image_url).toBe('uploads/test.jpg');
        });
    });

    describe('updateAvailability', () => {
        test('debería cambiar is_available', async () => {
            await repositoryUser.updateAvailability(ids.tech, false);
            const row = await repositoryUser.findById(ids.tech);
            expect(Boolean(row.is_available)).toBe(false);
        });
    });

    describe('hasActiveAppointments', () => {
        test('debería devolver false cuando el técnico no tiene citas activas', async () => {
            expect(await repositoryUser.hasActiveAppointments(ids.tech)).toBe(false);
        });

        test('debería devolver true cuando el técnico tiene una cita confirmada futura', async () => {
            await seed.run({ withProfiles: true, withTechAppointments: true });
            expect(await repositoryUser.hasActiveAppointments(ids.tech)).toBe(true);
        });

        test('debería devolver false cuando todas las citas están canceladas/completadas', async () => {
            await pool.query(
                `INSERT INTO appointments
                    (client_id, technician_id, scheduled_date, scheduled_time, status)
                 VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00', 'cancelled')`,
                [ids.client, ids.tech]
            );
            expect(await repositoryUser.hasActiveAppointments(ids.tech)).toBe(false);
        });
    });
});

describe('user.repository - Password Resets', () => {
    describe('saveResetCode', () => {
        test('debería guardar un código y poder consultarlo', async () => {
            const expires = new Date(Date.now() + 10 * 60 * 1000); // +10 min
            await repositoryUser.saveResetCode('admin@jyp.com', '123456', expires);

            const row = await repositoryUser.findValidResetCode('admin@jyp.com', '123456');
            expect(row).not.toBeNull();
        });

        test('debería reemplazar un código previo para el mismo email', async () => {
            const e1 = new Date(Date.now() + 10 * 60 * 1000);
            const e2 = new Date(Date.now() + 10 * 60 * 1000);
            await repositoryUser.saveResetCode('admin@jyp.com', '111111', e1);
            await repositoryUser.saveResetCode('admin@jyp.com', '222222', e2);

            // El primero ya no debe ser válido
            expect(await repositoryUser.findValidResetCode('admin@jyp.com', '111111')).toBeNull();
            // El segundo sí
            expect(await repositoryUser.findValidResetCode('admin@jyp.com', '222222')).not.toBeNull();
        });
    });

    describe('findValidResetCode', () => {
        test('debería devolver null para código expirado', async () => {
            const expired = new Date(Date.now() - 60 * 1000); // -1 min
            await repositoryUser.saveResetCode('admin@jyp.com', '999999', expired);
            expect(await repositoryUser.findValidResetCode('admin@jyp.com', '999999')).toBeNull();
        });

        test('debería devolver null para código incorrecto', async () => {
            const e = new Date(Date.now() + 10 * 60 * 1000);
            await repositoryUser.saveResetCode('admin@jyp.com', '123456', e);
            expect(await repositoryUser.findValidResetCode('admin@jyp.com', '000000')).toBeNull();
        });
    });

    describe('deleteResetCode', () => {
        test('debería eliminar el código', async () => {
            const e = new Date(Date.now() + 10 * 60 * 1000);
            await repositoryUser.saveResetCode('admin@jyp.com', '123456', e);
            await repositoryUser.deleteResetCode('admin@jyp.com');
            expect(await repositoryUser.findValidResetCode('admin@jyp.com', '123456')).toBeNull();
        });
    });
});

describe('user.repository - Device Tokens', () => {
    describe('saveDeviceToken', () => {
        test('debería insertar un token nuevo', async () => {
            await repositoryUser.saveDeviceToken(ids.admin, 'token-abc', 'android');
            const rows = await repositoryUser.getFCMTokens(ids.admin);
            expect(rows).toHaveLength(1);
            expect(rows[0].fcm_token).toBe('token-abc');
        });

        test('debería actualizar el mismo token (ON DUPLICATE KEY)', async () => {
            await repositoryUser.saveDeviceToken(ids.admin, 'token-abc', 'android');
            await repositoryUser.saveDeviceToken(ids.admin, 'token-abc', 'ios');
            const rows = await repositoryUser.getFCMTokens(ids.admin);
            expect(rows).toHaveLength(1);
            expect(rows[0].fcm_token).toBe('token-abc');
        });

        test('debería permitir múltiples tokens por user (tokens distintos)', async () => {
            await repositoryUser.saveDeviceToken(ids.admin, 'token-1', 'android');
            await repositoryUser.saveDeviceToken(ids.admin, 'token-2', 'ios');
            const rows = await repositoryUser.getFCMTokens(ids.admin);
            expect(rows).toHaveLength(2);
        });
    });

    describe('removeDeviceToken', () => {
        test('debería eliminar un token específico del user', async () => {
            await repositoryUser.saveDeviceToken(ids.admin, 'token-1', 'android');
            await repositoryUser.saveDeviceToken(ids.admin, 'token-2', 'ios');

            await repositoryUser.removeDeviceToken(ids.admin, 'token-1');
            const rows = await repositoryUser.getFCMTokens(ids.admin);
            expect(rows).toHaveLength(1);
            expect(rows[0].fcm_token).toBe('token-2');
        });
    });

    describe('getFCMTokens', () => {
        test('debería devolver array vacío para user sin tokens', async () => {
            const rows = await repositoryUser.getFCMTokens(ids.client);
            expect(rows).toEqual([]);
        });
    });
});