/**
 * auth.endpoint.test.js
 * Pruebas de integración de endpoints para /api/auth usando Supertest
 */

jest.mock('../../services/auth.service');

const authService = require('../../services/auth.service');
const AppError = require('../../utils/AppError');
const { request, app, clientToken, authHeader } = require('../setup/endpoint-helper');

describe('Endpoints: /api/auth', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        const validPayload = {
            email: 'nuevo@test.com',
            password: 'Password123!',
            role: 'client',
            personType: 'natural',
            names: 'Pedro',
            surnames: 'Ramirez'
        };

        test('debería retornar 201 y datos de sesión al registrar exitosamente', async () => {
            const mockRegistered = {
                userId: 15,
                email: validPayload.email,
                username: null,
                role: 'client',
                token: 'jwt_mock_token'
            };
            authService.registerUser.mockResolvedValue(mockRegistered);

            const res = await request(app)
                .post('/api/auth/register')
                .send(validPayload);

            expect(res.status).toBe(201);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockRegistered);
        });

        test('debería retornar 400 si faltan campos obligatorios o formato inválido', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'correo-no-valido',
                    password: '123',
                    role: 'rol_falso'
                });

            expect(res.status).toBe(400);
            expect(res.body.exito).toBe(false);
            expect(res.body).toHaveProperty('resultado');
            expect(authService.registerUser).not.toHaveBeenCalled();
        });

        test('debería retornar 409 si el correo o usuario ya existe en el servicio', async () => {
            authService.registerUser.mockRejectedValue(
                new AppError('El correo electrónico ya está registrado.', 409)
            );

            const res = await request(app)
                .post('/api/auth/register')
                .send(validPayload);

            expect(res.status).toBe(409);
            expect(res.body.exito).toBe(false);
            expect(res.body.mensaje).toBe('El correo electrónico ya está registrado.');
        });
    });

    describe('POST /api/auth/login', () => {
        test('debería retornar 200 y token de autenticación con credenciales válidas', async () => {
            const mockSession = {
                userId: 1,
                email: 'usuario@test.com',
                username: 'user1',
                role: 'client',
                token: 'jwt_session_token'
            };
            authService.loginUser.mockResolvedValue(mockSession);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'usuario@test.com', password: 'Password123!' });

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(res.body.resultado).toEqual(mockSession);
        });

        test('debería retornar 400 si falta el correo o la contraseña', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: '' });

            expect(res.status).toBe(400);
            expect(res.body.exito).toBe(false);
        });

        test('debería retornar 401 si las credenciales son inválidas', async () => {
            authService.loginUser.mockRejectedValue(
                new AppError('Correo o contraseña inválidos.', 401)
            );

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'usuario@test.com', password: 'wrongpassword' });

            expect(res.status).toBe(401);
            expect(res.body.exito).toBe(false);
            expect(res.body.mensaje).toBe('Correo o contraseña inválidos.');
        });
    });

    describe('POST /api/auth/forgot-password', () => {
        test('debería retornar 200 al solicitar recuperación de clave para correo válido', async () => {
            authService.requestPasswordReset.mockResolvedValue();

            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'usuario@test.com' });

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(authService.requestPasswordReset).toHaveBeenCalledWith('usuario@test.com');
        });

        test('debería retornar 404 si el correo no está registrado', async () => {
            authService.requestPasswordReset.mockRejectedValue(
                new AppError('No se encontró cuenta con este correo.', 404)
            );

            const res = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'desconocido@test.com' });

            expect(res.status).toBe(404);
            expect(res.body.exito).toBe(false);
        });
    });

    describe('POST /api/auth/verify-code', () => {
        test('debería retornar 200 si el código es válido', async () => {
            authService.verifyResetCode.mockResolvedValue();

            const res = await request(app)
                .post('/api/auth/verify-code')
                .send({ email: 'usuario@test.com', code: '123456' });

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
        });

        test('debería retornar 400 si el código no tiene 6 dígitos', async () => {
            const res = await request(app)
                .post('/api/auth/verify-code')
                .send({ email: 'usuario@test.com', code: '12' });

            expect(res.status).toBe(400);
            expect(res.body.exito).toBe(false);
        });
    });

    describe('POST /api/auth/reset-password', () => {
        test('debería retornar 200 al resetear clave exitosamente', async () => {
            authService.resetUserPassword.mockResolvedValue();

            const res = await request(app)
                .post('/api/auth/reset-password')
                .send({ email: 'usuario@test.com', code: '123456', newPassword: 'NewPassword123!' });

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(authService.resetUserPassword).toHaveBeenCalledWith('usuario@test.com', '123456', 'NewPassword123!');
        });
    });

    describe('POST /api/auth/change-password', () => {
        test('debería retornar 401 si no se envía header Authorization', async () => {
            const res = await request(app)
                .post('/api/auth/change-password')
                .send({ newPassword: 'NuevaPassword123' });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        test('debería retornar 200 al actualizar contraseña con token válido', async () => {
            authService.changeUserPassword.mockResolvedValue();

            const res = await request(app)
                .post('/api/auth/change-password')
                .set(authHeader(clientToken))
                .send({ newPassword: 'NuevaPassword123' });

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
            expect(authService.changeUserPassword).toHaveBeenCalledWith(10, 'NuevaPassword123');
        });
    });

    describe('POST /api/auth/validate-email', () => {
        test('debería responder 200 cuando el email es válido y disponible', async () => {
            authService.validateEmailAvailability.mockResolvedValue();

            const res = await request(app)
                .post('/api/auth/validate-email')
                .send({ email: 'disponible@test.com' });

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
        });

        test('debería responder 400 si no se envía email', async () => {
            const res = await request(app)
                .post('/api/auth/validate-email')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.exito).toBe(false);
        });
    });

    describe('POST /api/auth/validate-username', () => {
        test('debería responder 200 cuando el username está disponible', async () => {
            authService.validateUsernameAvailability.mockResolvedValue();

            const res = await request(app)
                .post('/api/auth/validate-username')
                .send({ username: 'nuevo_user' });

            expect(res.status).toBe(200);
            expect(res.body.exito).toBe(true);
        });

        test('debería responder 400 si no se envía username', async () => {
            const res = await request(app)
                .post('/api/auth/validate-username')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.exito).toBe(false);
        });
    });
});
