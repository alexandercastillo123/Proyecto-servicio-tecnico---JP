/**
 * Tests de integración para technician.repository.js.
 *
 * Estrategia:
 *  - Usa la BD de pruebas (servicio_tecnico_test).
 *  - beforeEach trunca las tablas y re-siembra los fixtures base con perfiles.
 *  - Valida búsqueda de técnicos con filtros y geolocalización (findNearby),
 *    gestión de horarios de atención (schedules), verificación de citas completadas,
 *    inserción de reseñas y recálculo de calificación promedio.
 */
const repositoryTechnician = require('../../../repository/technician.repository');
const repositoryAppointment = require('../../../repository/appointment.repository');
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

describe('technician.repository - Technicians', () => {
    describe('findAll y countAll', () => {
        test('debería listar técnicos disponibles con paginación', async () => {
            const techs = await repositoryTechnician.findAll({ limit: 10, offset: 0 });

            expect(techs.length).toBeGreaterThanOrEqual(1);
            const tech = techs.find(t => t.id === ids.tech);
            expect(tech).toBeDefined();
            expect(tech.email).toBe('tecnico@test.com');
            expect(tech.names).toBe('María');
            expect(Number(tech.rating)).toBe(4.8);
        });

        test('debería filtrar por ciudad y calificación mínima', async () => {
            const limaTechs = await repositoryTechnician.findAll({ city: 'Lima', minRating: 4.0, limit: 10, offset: 0 });
            const cuscoTechs = await repositoryTechnician.findAll({ city: 'Cusco', limit: 10, offset: 0 });

            expect(limaTechs.some(t => t.id === ids.tech)).toBe(true);
            expect(cuscoTechs.some(t => t.id === ids.tech)).toBe(false);

            const totalLima = await repositoryTechnician.countAll({ city: 'Lima', minRating: 4.0 });
            const totalCusco = await repositoryTechnician.countAll({ city: 'Cusco' });

            expect(totalLima).toBeGreaterThanOrEqual(1);
            expect(totalCusco).toBe(0);
        });

        test('no debería incluir técnicos con is_available = false', async () => {
            await pool.query('UPDATE user_profiles SET is_available = FALSE WHERE user_id = ?', [ids.tech]);

            const techs = await repositoryTechnician.findAll({ limit: 10, offset: 0 });
            expect(techs.some(t => t.id === ids.tech)).toBe(false);

            const count = await repositoryTechnician.countAll({});
            expect(count).toBe(0);
        });
    });

    describe('findById', () => {
        test('debería devolver el perfil del técnico por su id', async () => {
            const tech = await repositoryTechnician.findById(ids.tech);

            expect(tech).not.toBeNull();
            expect(tech.id).toBe(ids.tech);
            expect(tech.names).toBe('María');
            expect(tech.surnames).toBe('García');
            expect(tech.dni).toBe('87654321');
        });

        test('debería devolver null si el id no pertenece a un usuario con rol tech', async () => {
            const clientAsTech = await repositoryTechnician.findById(ids.client);
            expect(clientAsTech).toBeNull();
        });

        test('debería devolver null para id inexistente', async () => {
            const notFound = await repositoryTechnician.findById(999999);
            expect(notFound).toBeNull();
        });
    });

    describe('findNearby', () => {
        test('debería encontrar técnicos dentro del radio especificado', async () => {
            // Ubicar a la técnica en Lima centro (-12.046374, -77.042793)
            await pool.query(
                'UPDATE user_profiles SET latitude = -12.046374, longitude = -77.042793 WHERE user_id = ?',
                [ids.tech]
            );

            // Búsqueda desde punto cercano (1 km) con radio de 5 km
            const nearby = await repositoryTechnician.findNearby(-12.050000, -77.040000, 5);
            expect(nearby.some(t => t.id === ids.tech)).toBe(true);

            // Búsqueda con radio diminuto (0.01 km) que la excluya
            const tooFar = await repositoryTechnician.findNearby(-12.150000, -77.000000, 1);
            expect(tooFar.some(t => t.id === ids.tech)).toBe(false);
        });
    });
});

describe('technician.repository - Schedules', () => {
    describe('replaceSchedule y getSchedule', () => {
        test('debería reemplazar el horario completo del técnico y ordenarlo por día', async () => {
            const newSchedule = [
                { dayOfWeek: 'Wednesday', startTime: '10:00:00', endTime: '18:00:00', isActive: true },
                { dayOfWeek: 'Monday', startTime: '08:00:00', endTime: '16:00:00', isActive: true },
                { dayOfWeek: 'Friday', startTime: '09:00:00', endTime: '17:00:00', isActive: false },
            ];

            await repositoryTechnician.replaceSchedule(ids.tech, newSchedule);

            const fullSchedule = await repositoryTechnician.getSchedule(ids.tech);
            expect(fullSchedule).toHaveLength(3);
            // Orden por FIELD(day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
            expect(fullSchedule[0].day_of_week).toBe('Monday');
            expect(fullSchedule[1].day_of_week).toBe('Wednesday');
            expect(fullSchedule[2].day_of_week).toBe('Friday');

            const activeOnly = await repositoryTechnician.getSchedule(ids.tech, true);
            expect(activeOnly).toHaveLength(2);
            expect(activeOnly.some(s => s.day_of_week === 'Friday')).toBe(false);
        });
    });

    describe('updateScheduleEntry', () => {
        test('debería actualizar una entrada específica del horario', async () => {
            await repositoryTechnician.replaceSchedule(ids.tech, [
                { dayOfWeek: 'Monday', startTime: '08:00:00', endTime: '16:00:00', isActive: true },
            ]);

            const [initial] = await repositoryTechnician.getSchedule(ids.tech);
            const affected = await repositoryTechnician.updateScheduleEntry(initial.id, ids.tech, {
                startTime: '09:30:00',
                isActive: false,
            });

            expect(affected).toBe(1);

            const [updated] = await repositoryTechnician.getSchedule(ids.tech);
            expect(updated.start_time).toBe('09:30:00');
            expect(updated.end_time).toBe('16:00:00'); // Mantenido por COALESCE
            expect(updated.is_active).toBe(0);
        });
    });
});

describe('technician.repository - Reviews', () => {
    describe('hasCompletedAppointment', () => {
        test('debería devolver true cuando el cliente tiene al menos una cita completada con el técnico', async () => {
            const conn = await pool.getConnection();
            let apptId;
            try {
                apptId = await repositoryAppointment.create(
                    {
                        clientId: ids.client,
                        technicianId: ids.tech,
                        scheduledDate: '2026-09-01',
                        scheduledTime: '10:00:00',
                        description: 'Servicio finalizado',
                    },
                    conn
                );
            } finally {
                conn.release();
            }

            await repositoryAppointment.updateStatus(apptId, 'completed');

            const hasCompleted = await repositoryTechnician.hasCompletedAppointment(ids.client, ids.tech);
            expect(hasCompleted).toBe(true);
        });

        test('debería devolver false si la cita no está completada', async () => {
            const conn = await pool.getConnection();
            try {
                await repositoryAppointment.create(
                    {
                        clientId: ids.client,
                        technicianId: ids.tech,
                        scheduledDate: '2026-09-01',
                        scheduledTime: '10:00:00',
                        description: 'Servicio pendiente',
                    },
                    conn
                );
            } finally {
                conn.release();
            }

            const hasCompleted = await repositoryTechnician.hasCompletedAppointment(ids.client, ids.tech);
            expect(hasCompleted).toBe(false);
        });
    });

    describe('insertReview, hasExistingReview y recalculateRating', () => {
        test('debería insertar una reseña, verificar su existencia y recalcular el rating del técnico', async () => {
            expect(await repositoryTechnician.hasExistingReview(ids.client, ids.tech)).toBe(false);

            const reviewId = await repositoryTechnician.insertReview(
                null,
                ids.client,
                ids.tech,
                5,
                'Excelente atención y rapidez'
            );

            expect(reviewId).toBeGreaterThan(0);
            expect(await repositoryTechnician.hasExistingReview(ids.client, ids.tech)).toBe(true);

            // Recalcular rating
            await repositoryTechnician.recalculateRating(ids.tech);

            const tech = await repositoryTechnician.findById(ids.tech);
            expect(Number(tech.rating)).toBe(5.0);
            expect(tech.reviews_count).toBe(1);
        });
    });
});
