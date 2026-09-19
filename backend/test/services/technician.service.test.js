/**
 * technician.service.test.js
 * Pruebas unitarias para technician.service.js
 */

jest.mock('../../repository/technician.repository');

const technicianRepo = require('../../repository/technician.repository');
const technicianService = require('../../services/technician.service');
const AppError = require('../../utils/AppError');

describe('technician.service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getTechnicians', () => {
        test('debería calcular paginación por defecto y devolver técnicos y metadatos', async () => {
            const mockTechs = [{ id: 1, name: 'Juan Pérez' }, { id: 2, name: 'Carlos Gomez' }];
            technicianRepo.findAll.mockResolvedValue(mockTechs);
            technicianRepo.countAll.mockResolvedValue(20);

            const result = await technicianService.getTechnicians({
                city: 'Lima',
                minRating: 4
            });

            expect(technicianRepo.findAll).toHaveBeenCalledWith({
                city: 'Lima',
                minRating: 4,
                limit: 10,
                offset: 0
            });
            expect(technicianRepo.countAll).toHaveBeenCalledWith({
                city: 'Lima',
                minRating: 4
            });
            expect(result).toEqual({
                technicians: mockTechs,
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 20,
                    totalPages: 2
                }
            });
        });

        test('debería respetar page y limit personalizados y calcular offset y totalPages correctamente', async () => {
            technicianRepo.findAll.mockResolvedValue([{ id: 3 }]);
            technicianRepo.countAll.mockResolvedValue(11);

            const result = await technicianService.getTechnicians({
                page: '3',
                limit: '5'
            });

            expect(technicianRepo.findAll).toHaveBeenCalledWith({
                city: undefined,
                minRating: undefined,
                limit: '5',
                offset: 10 // (3 - 1) * 5
            });
            expect(result.pagination).toEqual({
                page: 3,
                limit: 5,
                total: 11,
                totalPages: 3 // ceil(11 / 5) = 3
            });
        });
    });

    describe('getTechnicianById', () => {
        test('debería retornar el técnico con su horario asociado', async () => {
            const mockTech = { id: 5, name: 'Roberto Tech', city: 'Arequipa' };
            const mockSchedule = [{ day_of_week: 'monday', start_time: '09:00' }];

            technicianRepo.findById.mockResolvedValue(mockTech);
            technicianRepo.getSchedule.mockResolvedValue(mockSchedule);

            const result = await technicianService.getTechnicianById(5);

            expect(technicianRepo.findById).toHaveBeenCalledWith(5);
            expect(technicianRepo.getSchedule).toHaveBeenCalledWith(5, true);
            expect(result).toEqual({
                ...mockTech,
                schedule: mockSchedule
            });
        });

        test('debería lanzar AppError 404 si el técnico no existe', async () => {
            technicianRepo.findById.mockResolvedValue(null);

            await expect(technicianService.getTechnicianById(999)).rejects.toThrow(
                new AppError('Técnico no encontrado.', 404)
            );
            expect(technicianRepo.getSchedule).not.toHaveBeenCalled();
        });
    });

    describe('getNearbyTechnicians', () => {
        test('debería lanzar AppError 400 si falta lat o lng', async () => {
            await expect(technicianService.getNearbyTechnicians({ lng: -77.03 })).rejects.toThrow(
                new AppError('Se requieren los parámetros lat y lng.', 400)
            );
            await expect(technicianService.getNearbyTechnicians({ lat: -12.04 })).rejects.toThrow(
                new AppError('Se requieren los parámetros lat y lng.', 400)
            );
        });

        test('debería lanzar AppError 400 si lat, lng o radius no son números válidos', async () => {
            await expect(technicianService.getNearbyTechnicians({ lat: 'invalido', lng: -77.03 })).rejects.toThrow(
                new AppError('Los parámetros lat, lng y radius deben ser números válidos.', 400)
            );
            await expect(technicianService.getNearbyTechnicians({ lat: -12.04, lng: 'invalido' })).rejects.toThrow(
                new AppError('Los parámetros lat, lng y radius deben ser números válidos.', 400)
            );
            await expect(technicianService.getNearbyTechnicians({ lat: -12.04, lng: -77.03, radius: 'abc' })).rejects.toThrow(
                new AppError('Los parámetros lat, lng y radius deben ser números válidos.', 400)
            );
        });

        test('debería parsear coordenadas y llamar a findNearby con radio por defecto (5)', async () => {
            const mockNearby = [{ id: 1, name: 'Tech Cerca', distance_km: 1.5 }];
            technicianRepo.findNearby.mockResolvedValue(mockNearby);

            const result = await technicianService.getNearbyTechnicians({
                lat: '-12.046374',
                lng: '-77.042793'
            });

            expect(technicianRepo.findNearby).toHaveBeenCalledWith(-12.046374, -77.042793, 5);
            expect(result).toEqual(mockNearby);
        });

        test('debería aceptar un radio personalizado', async () => {
            technicianRepo.findNearby.mockResolvedValue([]);

            await technicianService.getNearbyTechnicians({
                lat: -12.0,
                lng: -77.0,
                radius: 15
            });

            expect(technicianRepo.findNearby).toHaveBeenCalledWith(-12.0, -77.0, 15);
        });
    });

    describe('getTechnicianSchedule', () => {
        test('debería consultar el horario con includeInactive en false', async () => {
            const mockSchedule = [{ id: 1, is_active: 1 }];
            technicianRepo.getSchedule.mockResolvedValue(mockSchedule);

            const result = await technicianService.getTechnicianSchedule(7);

            expect(technicianRepo.getSchedule).toHaveBeenCalledWith(7, false);
            expect(result).toEqual(mockSchedule);
        });
    });

    describe('createSchedule', () => {
        test('debería lanzar AppError 400 si schedules no es un array o está vacío', async () => {
            await expect(technicianService.createSchedule(7, null)).rejects.toThrow(
                new AppError('Se requiere un array de horarios válido.', 400)
            );
            await expect(technicianService.createSchedule(7, 'no-array')).rejects.toThrow(
                new AppError('Se requiere un array de horarios válido.', 400)
            );
            await expect(technicianService.createSchedule(7, [])).rejects.toThrow(
                new AppError('Se requiere un array de horarios válido.', 400)
            );
        });

        test('debería delegar el reemplazo de horarios al repositorio', async () => {
            const schedules = [{ day_of_week: 'monday', start_time: '08:00', end_time: '12:00' }];
            technicianRepo.replaceSchedule.mockResolvedValue();

            await technicianService.createSchedule(7, schedules);

            expect(technicianRepo.replaceSchedule).toHaveBeenCalledWith(7, schedules);
        });
    });

    describe('updateSchedule', () => {
        test('debería actualizar la entrada de horario correctamente', async () => {
            technicianRepo.updateScheduleEntry.mockResolvedValue(1);

            await expect(
                technicianService.updateSchedule(10, 7, { is_active: false })
            ).resolves.not.toThrow();

            expect(technicianRepo.updateScheduleEntry).toHaveBeenCalledWith(10, 7, { is_active: false });
        });

        test('debería lanzar AppError 404 si affected === 0 (no encontrado o no autorizado)', async () => {
            technicianRepo.updateScheduleEntry.mockResolvedValue(0);

            await expect(
                technicianService.updateSchedule(999, 7, { is_active: false })
            ).rejects.toThrow(new AppError('Horario no encontrado o no autorizado.', 404));
        });
    });

    describe('addReview', () => {
        test('debería lanzar AppError 400 si technicianId o rating faltan', async () => {
            await expect(
                technicianService.addReview({ clientId: 1, rating: 5 })
            ).rejects.toThrow(new AppError('Técnico y rating son obligatorios.', 400));

            await expect(
                technicianService.addReview({ clientId: 1, technicianId: 2 })
            ).rejects.toThrow(new AppError('Técnico y rating son obligatorios.', 400));
        });

        test('debería lanzar AppError 403 si el cliente no ha completado citas con el técnico', async () => {
            technicianRepo.hasCompletedAppointment.mockResolvedValue(false);

            await expect(
                technicianService.addReview({ clientId: 1, technicianId: 2, rating: 5 })
            ).rejects.toThrow(
                new AppError('Solo puedes reseñar después de haber completado un servicio con este técnico.', 403)
            );
            expect(technicianRepo.hasCompletedAppointment).toHaveBeenCalledWith(1, 2);
        });

        test('debería lanzar AppError 400 si el cliente ya ha calificado al técnico', async () => {
            technicianRepo.hasCompletedAppointment.mockResolvedValue(true);
            technicianRepo.hasExistingReview.mockResolvedValue(true);

            await expect(
                technicianService.addReview({ clientId: 1, technicianId: 2, rating: 5 })
            ).rejects.toThrow(new AppError('Ya has calificado a este técnico.', 400));
            expect(technicianRepo.hasExistingReview).toHaveBeenCalledWith(1, 2);
        });

        test('debería insertar la reseña y recalcular el rating promedio exitosamente', async () => {
            technicianRepo.hasCompletedAppointment.mockResolvedValue(true);
            technicianRepo.hasExistingReview.mockResolvedValue(false);
            technicianRepo.insertReview.mockResolvedValue(123);
            technicianRepo.recalculateRating.mockResolvedValue();

            await technicianService.addReview({
                clientId: 1,
                technicianId: 2,
                rating: 5,
                comment: 'Excelente servicio',
                appointmentId: 45
            });

            expect(technicianRepo.insertReview).toHaveBeenCalledWith(45, 1, 2, 5, 'Excelente servicio');
            expect(technicianRepo.recalculateRating).toHaveBeenCalledWith(2);
        });
    });
});
