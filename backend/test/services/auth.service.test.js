/**
 * auth.service.test.js
 * Pruebas unitarias para auth.service.js
 */

const mockConn = {
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
    query: jest.fn()
};

const mockPool = {
    getConnection: jest.fn().mockResolvedValue(mockConn),
    query: jest.fn()
};

jest.mock('../../config/database', () => ({
    pool: mockPool
}));

jest.mock('bcryptjs');
jest.mock('../../repository/user.repository');
jest.mock('../../utils/jwt');
jest.mock('../../utils/validators');
jest.mock('../../utils/email.service');

const bcrypt = require('bcryptjs');
const userRepo = require('../../repository/user.repository');
const { generateToken } = require('../../utils/jwt');
const { isValidEmail } = require('../../utils/validators');
const { sendResetCode } = require('../../utils/email.service');
const authService = require('../../services/auth.service');
const AppError = require('../../utils/AppError');

describe('auth.service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPool.getConnection.mockResolvedValue(mockConn);
        mockConn.beginTransaction.mockResolvedValue();
        mockConn.commit.mockResolvedValue();
        mockConn.rollback.mockResolvedValue();
        mockConn.release.mockReturnValue();
        mockConn.query.mockResolvedValue([[]]);
        bcrypt.hash.mockResolvedValue('hashed_password_123');
        bcrypt.compare.mockResolvedValue(true);
        generateToken.mockReturnValue('jwt_test_token_xyz');
        isValidEmail.mockResolvedValue(true);
    });

    describe('registerUser', () => {
        const clientPayload = {
            email: 'cliente@test.com',
            username: 'cliente1',
            password: 'Password123!',
            role: 'client',
            personType: 'natural',
            names: 'Juan',
            surnames: 'Pérez',
            dni: '12345678',
            phone: '987654321',
            address: 'Av. Siempre Viva 123',
            city: 'Lima',
            policiesAccepted: true
        };

        test('debería lanzar AppError 400 si el email no es válido', async () => {
            isValidEmail.mockResolvedValue(false);

            await expect(authService.registerUser(clientPayload)).rejects.toThrow(
                new AppError('El correo electrónico no existe o el dominio es inválido.', 400)
            );
            expect(mockPool.getConnection).not.toHaveBeenCalled();
        });

        test('debería lanzar AppError 409 y hacer rollback si el correo ya está registrado', async () => {
            mockConn.query.mockImplementation((sql) => {
                if (sql.includes('SELECT id FROM users WHERE email = ?')) {
                    return Promise.resolve([[{ id: 1 }]]);
                }
                return Promise.resolve([[]]);
            });

            await expect(authService.registerUser(clientPayload)).rejects.toThrow(
                new AppError('El correo electrónico ya está registrado.', 409)
            );
            expect(mockConn.rollback).toHaveBeenCalled();
            expect(mockConn.release).toHaveBeenCalled();
        });

        test('debería lanzar AppError 409 si el username ya está registrado', async () => {
            mockConn.query.mockImplementation((sql) => {
                if (sql.includes('SELECT id FROM users WHERE email = ?')) {
                    return Promise.resolve([[]]);
                }
                if (sql.includes('SELECT id FROM users WHERE username = ?')) {
                    return Promise.resolve([[{ id: 2 }]]);
                }
                return Promise.resolve([[]]);
            });

            await expect(authService.registerUser(clientPayload)).rejects.toThrow(
                new AppError('El nombre de usuario ya está registrado.', 409)
            );
            expect(mockConn.rollback).toHaveBeenCalled();
            expect(mockConn.release).toHaveBeenCalled();
        });

        test('debería lanzar AppError 409 si el DNI o RUC ya existe en user_profiles', async () => {
            mockConn.query.mockImplementation((sql) => {
                if (sql.includes('SELECT user_id FROM user_profiles')) {
                    return Promise.resolve([[{ user_id: 3 }]]);
                }
                return Promise.resolve([[]]);
            });

            await expect(authService.registerUser(clientPayload)).rejects.toThrow(
                new AppError('El DNI ya está registrado.', 409)
            );
            expect(mockConn.rollback).toHaveBeenCalled();
            expect(mockConn.release).toHaveBeenCalled();
        });

        test('debería registrar un cliente exitosamente con transacción confirmada', async () => {
            mockConn.query.mockResolvedValue([[]]);
            userRepo.create.mockResolvedValue(10);
            userRepo.createProfile.mockResolvedValue();

            const result = await authService.registerUser(clientPayload);

            expect(mockConn.beginTransaction).toHaveBeenCalled();
            expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
            expect(userRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: clientPayload.email,
                    username: clientPayload.username,
                    role: 'client'
                }),
                mockConn
            );
            expect(userRepo.createProfile).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 10,
                    names: 'Juan',
                    surnames: 'Pérez',
                    dni: '12345678'
                }),
                mockConn
            );
            expect(mockConn.commit).toHaveBeenCalled();
            expect(mockConn.release).toHaveBeenCalled();
            expect(result).toEqual({
                userId: 10,
                email: clientPayload.email,
                username: clientPayload.username,
                role: 'client',
                token: 'jwt_test_token_xyz'
            });
        });

        test('debería registrar un técnico con horarios por defecto', async () => {
            const techPayload = {
                ...clientPayload,
                role: 'tech',
                referenceAddress: 'Frente al parque',
                latitude: -12.0463,
                longitude: -77.0427
            };
            mockConn.query.mockResolvedValue([[]]);
            userRepo.create.mockResolvedValue(20);
            userRepo.createProfile.mockResolvedValue();

            const result = await authService.registerUser(techPayload);

            expect(result.userId).toBe(20);
            expect(result.role).toBe('tech');
            // Schedules insert query
            expect(mockConn.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO technician_schedules'),
                expect.any(Array)
            );
            expect(mockConn.commit).toHaveBeenCalled();
        });

        test('debería registrar un técnico con horarios personalizados', async () => {
            const techCustomPayload = {
                ...clientPayload,
                role: 'tech',
                schedules: [
                    { dayOfWeek: 'Monday', startTime: '09:00:00', endTime: '13:00:00', isActive: true }
                ]
            };
            mockConn.query.mockResolvedValue([[]]);
            userRepo.create.mockResolvedValue(21);
            userRepo.createProfile.mockResolvedValue();

            await authService.registerUser(techCustomPayload);

            expect(mockConn.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO technician_schedules'),
                [[[21, 'Monday', '09:00:00', '13:00:00', true]]]
            );
            expect(mockConn.commit).toHaveBeenCalled();
        });
    });

    describe('loginUser', () => {
        const mockDbUser = {
            id: 5,
            email: 'user@test.com',
            username: 'user5',
            password_hash: '$2a$10$hashed',
            role: 'client'
        };

        test('debería autenticar credenciales correctas y devolver JWT', async () => {
            userRepo.findByEmail.mockResolvedValue(mockDbUser);
            bcrypt.compare.mockResolvedValue(true);

            const result = await authService.loginUser('user@test.com', 'mypassword');

            expect(userRepo.findByEmail).toHaveBeenCalledWith('user@test.com');
            expect(bcrypt.compare).toHaveBeenCalledWith('mypassword', mockDbUser.password_hash);
            expect(generateToken).toHaveBeenCalledWith({
                id: 5,
                email: 'user@test.com',
                username: 'user5',
                role: 'client'
            });
            expect(result).toEqual({
                userId: 5,
                email: 'user@test.com',
                username: 'user5',
                role: 'client',
                token: 'jwt_test_token_xyz'
            });
        });

        test('debería lanzar AppError 401 si el usuario no existe', async () => {
            userRepo.findByEmail.mockResolvedValue(null);

            await expect(authService.loginUser('noexiste@test.com', 'pwd')).rejects.toThrow(
                new AppError('Correo o contraseña inválidos.', 401)
            );
        });

        test('debería lanzar AppError 401 si la contraseña no coincide', async () => {
            userRepo.findByEmail.mockResolvedValue(mockDbUser);
            bcrypt.compare.mockResolvedValue(false);

            await expect(authService.loginUser('user@test.com', 'wrongpassword')).rejects.toThrow(
                new AppError('Correo o contraseña inválidos.', 401)
            );
        });
    });

    describe('requestPasswordReset', () => {
        test('debería lanzar AppError 404 si el usuario no existe', async () => {
            userRepo.findByEmail.mockResolvedValue(null);

            await expect(authService.requestPasswordReset('inexistente@test.com')).rejects.toThrow(
                new AppError('No se encontró cuenta con este correo.', 404)
            );
        });

        test('debería lanzar AppError 500 si el envío del correo falla', async () => {
            userRepo.findByEmail.mockResolvedValue({ id: 1, email: 'juan@test.com' });
            userRepo.saveResetCode.mockResolvedValue();
            sendResetCode.mockResolvedValue(false);

            await expect(authService.requestPasswordReset('juan@test.com')).rejects.toThrow(
                new AppError('No se pudo enviar el correo de recuperación. Inténtalo más tarde.', 500)
            );
        });

        test('debería guardar el código y enviar correo exitosamente', async () => {
            userRepo.findByEmail.mockResolvedValue({ id: 1, email: 'juan@test.com' });
            userRepo.saveResetCode.mockResolvedValue();
            sendResetCode.mockResolvedValue(true);

            await authService.requestPasswordReset('juan@test.com');

            expect(userRepo.saveResetCode).toHaveBeenCalledWith(
                'juan@test.com',
                expect.stringMatching(/^\d{6}$/),
                expect.any(Date)
            );
            expect(sendResetCode).toHaveBeenCalledWith('juan@test.com', expect.stringMatching(/^\d{6}$/));
        });
    });

    describe('verifyResetCode', () => {
        test('debería lanzar AppError 400 si el código es inválido o expiró', async () => {
            userRepo.findValidResetCode.mockResolvedValue(null);

            await expect(authService.verifyResetCode('correo@test.com', '000000')).rejects.toThrow(
                new AppError('Código inválido o expirado.', 400)
            );
        });

        test('debería validar con éxito si existe registro válido', async () => {
            userRepo.findValidResetCode.mockResolvedValue({ id: 1, code: '123456' });

            await expect(authService.verifyResetCode('correo@test.com', '123456')).resolves.toBeUndefined();
        });
    });

    describe('resetUserPassword', () => {
        test('debería actualizar contraseña y eliminar código de reseteo', async () => {
            userRepo.findValidResetCode.mockResolvedValue({ id: 1, code: '123456' });
            userRepo.updatePasswordByEmail.mockResolvedValue(1);
            userRepo.deleteResetCode.mockResolvedValue();

            await authService.resetUserPassword('correo@test.com', '123456', 'nuevaClave123');

            expect(bcrypt.hash).toHaveBeenCalledWith('nuevaClave123', 10);
            expect(userRepo.updatePasswordByEmail).toHaveBeenCalledWith('correo@test.com', 'hashed_password_123');
            expect(userRepo.deleteResetCode).toHaveBeenCalledWith('correo@test.com');
        });

        test('debería lanzar AppError 404 si ningún usuario fue actualizado', async () => {
            userRepo.findValidResetCode.mockResolvedValue({ id: 1, code: '123456' });
            userRepo.updatePasswordByEmail.mockResolvedValue(0);

            await expect(authService.resetUserPassword('correo@test.com', '123456', 'nuevaClave123')).rejects.toThrow(
                new AppError('Usuario no encontrado.', 404)
            );
        });
    });

    describe('changeUserPassword', () => {
        test('debería cambiar la contraseña de un usuario autenticado', async () => {
            userRepo.updatePassword.mockResolvedValue(1);

            await authService.changeUserPassword(5, 'claveNuevaSegura');

            expect(bcrypt.hash).toHaveBeenCalledWith('claveNuevaSegura', 10);
            expect(userRepo.updatePassword).toHaveBeenCalledWith(5, 'hashed_password_123');
        });

        test('debería lanzar AppError 404 si el usuario no existe', async () => {
            userRepo.updatePassword.mockResolvedValue(0);

            await expect(authService.changeUserPassword(999, 'claveNuevaSegura')).rejects.toThrow(
                new AppError('Usuario no encontrado.', 404)
            );
        });
    });

    describe('validateEmailAvailability', () => {
        test('debería lanzar AppError 400 si el formato de correo o dominio no es válido', async () => {
            isValidEmail.mockResolvedValue(false);

            await expect(authService.validateEmailAvailability('invalido@')).rejects.toThrow(
                new AppError('El correo electrónico no existe o el dominio es inválido.', 400)
            );
        });

        test('debería lanzar AppError 409 si el correo ya está registrado', async () => {
            isValidEmail.mockResolvedValue(true);
            userRepo.emailExists.mockResolvedValue(true);

            await expect(authService.validateEmailAvailability('existe@test.com')).rejects.toThrow(
                new AppError('El correo electrónico ya está registrado.', 409)
            );
        });

        test('debería pasar sin errores si el correo es válido y está disponible', async () => {
            isValidEmail.mockResolvedValue(true);
            userRepo.emailExists.mockResolvedValue(false);

            await expect(authService.validateEmailAvailability('disponible@test.com')).resolves.toBeUndefined();
        });
    });

    describe('validateUsernameAvailability', () => {
        test('debería lanzar AppError 409 si el username ya está registrado', async () => {
            userRepo.usernameExists.mockResolvedValue(true);

            await expect(authService.validateUsernameAvailability('usuario_repetido')).rejects.toThrow(
                new AppError('El nombre de usuario ya está registrado.', 409)
            );
        });

        test('debería pasar sin errores si el username está disponible', async () => {
            userRepo.usernameExists.mockResolvedValue(false);

            await expect(authService.validateUsernameAvailability('usuario_libre')).resolves.toBeUndefined();
        });
    });
});
