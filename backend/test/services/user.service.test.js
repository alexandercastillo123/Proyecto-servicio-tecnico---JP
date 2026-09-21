/**
 * user.service.test.js
 * Pruebas unitarias para user.service.js
 */

jest.mock('../../repository/user.repository');

const userRepo = require('../../repository/user.repository');
const userService = require('../../services/user.service');
const AppError = require('../../utils/AppError');

describe('user.service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getProfile', () => {
        test('debería retornar el usuario si existe', async () => {
            const mockUser = { id: 1, email: 'user@test.com', username: 'juanp', role: 'client' };
            userRepo.findById.mockResolvedValue(mockUser);

            const result = await userService.getProfile(1);

            expect(userRepo.findById).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockUser);
        });

        test('debería lanzar AppError 404 si el usuario no existe', async () => {
            userRepo.findById.mockResolvedValue(null);

            await expect(userService.getProfile(999)).rejects.toThrow(
                new AppError('Usuario no encontrado.', 404)
            );
        });
    });

    describe('getUserById', () => {
        test('debería retornar datos públicos del usuario si existe', async () => {
            const mockPublicUser = { id: 2, username: 'tech_maria', role: 'tech', names: 'María' };
            userRepo.findPublicById.mockResolvedValue(mockPublicUser);

            const result = await userService.getUserById(2);

            expect(userRepo.findPublicById).toHaveBeenCalledWith(2);
            expect(result).toEqual(mockPublicUser);
        });

        test('debería lanzar AppError 404 si no se encuentra', async () => {
            userRepo.findPublicById.mockResolvedValue(null);

            await expect(userService.getUserById(999)).rejects.toThrow(
                new AppError('Usuario no encontrado.', 404)
            );
        });
    });

    describe('updateProfile', () => {
        test('debería actualizar el perfil sin cambiar nombre de usuario cuando no se envía username', async () => {
            const fields = { names: 'Carlos', phone: '999888777' };
            userRepo.updateProfile.mockResolvedValue();

            await userService.updateProfile(1, fields);

            expect(userRepo.usernameExists).not.toHaveBeenCalled();
            expect(userRepo.updateUsername).not.toHaveBeenCalled();
            expect(userRepo.updateProfile).toHaveBeenCalledWith(1, fields);
        });

        test('debería actualizar username y perfil si el nuevo username está disponible', async () => {
            const fields = { username: 'carlos_new', names: 'Carlos' };
            userRepo.usernameExists.mockResolvedValue(false);
            userRepo.updateUsername.mockResolvedValue();
            userRepo.updateProfile.mockResolvedValue();

            await userService.updateProfile(1, fields);

            expect(userRepo.usernameExists).toHaveBeenCalledWith('carlos_new', 1);
            expect(userRepo.updateUsername).toHaveBeenCalledWith(1, 'carlos_new');
            expect(userRepo.updateProfile).toHaveBeenCalledWith(1, fields);
        });

        test('debería lanzar AppError 409 si el username ya está en uso', async () => {
            const fields = { username: 'ocupado' };
            userRepo.usernameExists.mockResolvedValue(true);

            await expect(userService.updateProfile(1, fields)).rejects.toThrow(
                new AppError('El nombre de usuario ya está en uso por otra persona.', 409)
            );
            expect(userRepo.updateUsername).not.toHaveBeenCalled();
            expect(userRepo.updateProfile).not.toHaveBeenCalled();
        });
    });

    describe('updateProfileImage', () => {
        test('debería delegar la actualización de la imagen al repositorio', async () => {
            userRepo.updateProfileImage.mockResolvedValue();

            await userService.updateProfileImage(1, 'uploads/avatar.png');

            expect(userRepo.updateProfileImage).toHaveBeenCalledWith(1, 'uploads/avatar.png');
        });
    });

    describe('toggleAvailability', () => {
        test('debería permitir activar la disponibilidad sin validar citas activas', async () => {
            userRepo.updateAvailability.mockResolvedValue();

            await userService.toggleAvailability(1, true);

            expect(userRepo.hasActiveAppointments).not.toHaveBeenCalled();
            expect(userRepo.updateAvailability).toHaveBeenCalledWith(1, true);
        });

        test('debería permitir desactivar la disponibilidad si no tiene citas activas', async () => {
            userRepo.hasActiveAppointments.mockResolvedValue(false);
            userRepo.updateAvailability.mockResolvedValue();

            await userService.toggleAvailability(1, false);

            expect(userRepo.hasActiveAppointments).toHaveBeenCalledWith(1);
            expect(userRepo.updateAvailability).toHaveBeenCalledWith(1, false);
        });

        test('debería lanzar AppError 400 si se intenta desactivar teniendo citas activas', async () => {
            userRepo.hasActiveAppointments.mockResolvedValue(true);

            await expect(userService.toggleAvailability(1, false)).rejects.toThrow(
                new AppError('No puedes desactivar tu cuenta mientras tengas citas activas. Finaliza o cancela tus servicios pendientes primero.', 400)
            );
            expect(userRepo.updateAvailability).not.toHaveBeenCalled();
        });
    });
});
