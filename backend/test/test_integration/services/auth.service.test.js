const authService = require('../../../services/auth.service');
const userRepo = require('../../../repository/user.repository');
const bcrypt = require('bcryptjs');

jest.mock('../../../repository/user.repository');
jest.mock('bcryptjs');

describe('Pruebas Unitarias - Auth Service (Funciones Reales)', () => {

    // éxito
    test('Debería iniciar sesión y retornar un token si el correo y clave coinciden', async () => {
        const mockUser = { id: 5, email: 'user@test.com', password_hash: 'hash123', username: 'testuser', role: 'client' };
        userRepo.findByEmail.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);
        const result = await authService.loginUser('user@test.com', 'clave123');
        expect(result).toHaveProperty('token');
        expect(result.userId).toBe(5);
    });

    // error
    test('Debería lanzar AppError 401 si la contraseña ingresada es inválida', async () => {
        const mockUser = { id: 5, email: 'user@test.com', password_hash: 'hash123' };
        userRepo.findByEmail.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(false);

        await expect(authService.loginUser('user@test.com', 'clave_erronea'))
            .rejects.toThrow('Correo o contraseña inválidos.');
    });
});