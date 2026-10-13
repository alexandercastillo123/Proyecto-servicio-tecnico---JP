/**
 * Tests de integracion para user.service.js
 *
 * Valida:
 *  - getProfile: devuelve perfil completo uniendo users + user_profiles
 *  - updateProfile: delega a repository.updateProfile con COALESCE
 *  - updateProfileImage: delega a repository.updateProfileImage
 *  - toggleAvailability: lanza error si tiene citas activas (tech)
 *  - getUserById: devuelve datos publicos
 */
const userService = require('../../../services/user.service');
const userRepo = require('../../../repository/user.repository');
const seed = require('../../setup/seed');
const { pool } = require('../../../config/database');
const AppError = require('../../../utils/AppError');

let ids;

beforeEach(async () => {
    ids = await seed.run({ withProfiles: true });
});

afterAll(async () => {
    try {
        await seed.clear();
    } catch (_) { /* noop */ }
});

describe('user.service - getProfile', () => {
    test('deberia devolver el perfil completo del usuario', async () => {
        const user = await userService.getProfile(ids.tech);
        expect(user.id).toBe(ids.tech);
        expect(user.email).toBe('tecnico@test.com');
        expect(user.role).toBe('tech');
        expect(user.names).toBe('María');
        expect(user.surnames).toBe('García');
        expect(user.dni).toBe('87654321');
    });

    test('deberia lanzar AppError 404 si el usuario no existe', async () => {
        await expect(userService.getProfile(999999)).rejects.toThrow(AppError);
        await expect(userService.getProfile(999999)).rejects.toThrow('Usuario no encontrado.');
    });
});

describe('user.service - getUserById', () => {
    test('deberia devolver datos publicos del usuario', async () => {
        const user = await userService.getUserById(ids.client);
        expect(user.id).toBe(ids.client);
        expect(user.username).toBe('cliente_test');
        expect(user.role).toBe('client');
        expect(user.names).toBe('Juan');
    });

    test('deberia lanzar AppError 404 si no existe', async () => {
        await expect(userService.getUserById(999999)).rejects.toThrow(AppError);
    });
});

describe('user.service - updateProfile', () => {
    test('deberia actualizar el username cuando se proporciona', async () => {
        await userService.updateProfile(ids.client, { username: 'cliente_nuevo' });

        const updated = await userRepo.findById(ids.client);
        expect(updated.username).toBe('cliente_nuevo');
    });

    test('deberia lanzar AppError 409 si el username ya esta en uso', async () => {
        await expect(
            userService.updateProfile(ids.client, { username: 'admin_jyp' })
        ).rejects.toThrow(AppError);
        await expect(
            userService.updateProfile(ids.client, { username: 'admin_jyp' })
        ).rejects.toThrow('El nombre de usuario ya está en uso');
    });

    test('deberia actualizar campos de perfil sin username', async () => {
        await userService.updateProfile(ids.client, {
            names: 'Pedro',
            surnames: 'López',
            phone: '911222333',
        });

        const updated = await userRepo.findById(ids.client);
        expect(updated.names).toBe('Pedro');
        expect(updated.surnames).toBe('López');
        expect(updated.phone).toBe('911222333');
        // Campos no enviados se conservan
        expect(updated.dni).toBe('12345678');
    });

    test('no deberia lanzar error si el username ya existe y se usa excludeId internamente', async () => {
        // Verificamos el comportamiento del repository con usernameExists
        const exists = await userRepo.usernameExists('cliente_test', ids.client);
        expect(exists).toBe(false);
    });
});

describe('user.service - updateProfileImage', () => {
    test('deberia delegar al repository y actualizar la imagen', async () => {
        await userService.updateProfileImage(ids.admin, 'uploads/foto_perfil.jpg');

        const updated = await userRepo.findById(ids.admin);
        expect(updated.profile_image_url).toBe('uploads/foto_perfil.jpg');
    });
});

describe('user.service - toggleAvailability', () => {
    test('deberia cambiar la disponibilidad del tecnico', async () => {
        await userService.toggleAvailability(ids.tech, false);

        const updated = await userRepo.findById(ids.tech);
        expect(Boolean(updated.is_available)).toBe(false);
    });

    test('deberia lanzar AppError si el tecnico tiene citas activas', async () => {
        await seed.run({ withProfiles: true, withTechAppointments: true });

        await expect(
            userService.toggleAvailability(ids.tech, false)
        ).rejects.toThrow(AppError);
        await expect(
            userService.toggleAvailability(ids.tech, false)
        ).rejects.toThrow('No puedes desactivar tu cuenta mientras tengas citas activas');
    });
});
