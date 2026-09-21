/**
 * users.endpoint.test.js
 * Pruebas de integración de endpoints para /api/users usando Supertest
 */

jest.mock('../../services/user.service');

const userService = require('../../services/user.service');
const AppError = require('../../utils/AppError');
const { request, app, clientToken, techToken, authHeader } = require('../setup/endpoint-helper');

describe('Endpoints: /api/users', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/users/profile', () => {
        test('debería retornar 401 si no hay token', async () => {
            const res = await request(app).get('/api/users/profile');
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        test('debería retornar 200 y perfil del usuario autenticado', async () => {
            const mockProfile = { id: 10, email: 'client@test.com', names: 'Juan' };
            userService.getProfile.mockResolvedValue(mockProfile);

            const res = await request(app)
                .get('/api/users/profile')
                .set(authHeader(clientToken));

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockProfile);
            expect(userService.getProfile).toHaveBeenCalledWith(10);
        });

        test('debería retornar 404 si el usuario no existe', async () => {
            userService.getProfile.mockRejectedValue(new AppError('Usuario no encontrado.', 404));

            const res = await request(app)
                .get('/api/users/profile')
                .set(authHeader(clientToken));

            expect(res.status).toBe(404);
            expect(res.body.exito).toBe(false);
        });
    });

    describe('PUT /api/users/profile', () => {
        test('debería retornar 401 si no hay token', async () => {
            const res = await request(app).put('/api/users/profile').send({ names: 'Carlos' });
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        test('debería retornar 200 al actualizar perfil exitosamente', async () => {
            userService.updateProfile.mockResolvedValue();

            const res = await request(app)
                .put('/api/users/profile')
                .set(authHeader(clientToken))
                .send({ names: 'Carlos', phone: '999888777' });

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(userService.updateProfile).toHaveBeenCalledWith(10, expect.objectContaining({ names: 'Carlos' }));
        });

        test('debería retornar 409 si el username a actualizar ya está ocupado', async () => {
            userService.updateProfile.mockRejectedValue(
                new AppError('El nombre de usuario ya está en uso por otra persona.', 409)
            );

            const res = await request(app)
                .put('/api/users/profile')
                .set(authHeader(clientToken))
                .send({ username: 'repetido' });

            expect(res.status).toBe(409);
            expect(res.body.exito).toBe(false);
        });
    });

    describe('GET /api/users/:id', () => {
        test('debería retornar 200 con datos públicos del usuario', async () => {
            const mockPublic = { id: 5, username: 'pedro_tech', names: 'Pedro' };
            userService.getUserById.mockResolvedValue(mockPublic);

            const res = await request(app).get('/api/users/5');

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockPublic);
            expect(userService.getUserById).toHaveBeenCalledWith('5');
        });

        test('debería retornar 404 si el usuario no existe', async () => {
            userService.getUserById.mockRejectedValue(new AppError('Usuario no encontrado.', 404));

            const res = await request(app).get('/api/users/999');

            expect(res.status).toBe(404);
            expect(res.body.exito).toBe(false);
        });
    });

    describe('PATCH /api/users/availability', () => {
        test('debería retornar 401 si no está autenticado', async () => {
            const res = await request(app).patch('/api/users/availability').send({ is_available: true });
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        test('debería retornar 200 al cambiar disponibilidad', async () => {
            userService.toggleAvailability.mockResolvedValue();

            const res = await request(app)
                .patch('/api/users/availability')
                .set(authHeader(techToken))
                .send({ is_available: false });

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(userService.toggleAvailability).toHaveBeenCalledWith(20, false);
        });

        test('debería retornar 400 si tiene citas pendientes al desactivar', async () => {
            userService.toggleAvailability.mockRejectedValue(
                new AppError('No puedes desactivar tu cuenta mientras tengas citas activas.', 400)
            );

            const res = await request(app)
                .patch('/api/users/availability')
                .set(authHeader(techToken))
                .send({ is_available: false });

            expect(res.status).toBe(400);
            expect(res.body.exito).toBe(false);
        });
    });
});
