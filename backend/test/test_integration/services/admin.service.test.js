const adminService = require('../../../services/admin.service');
const adminRepo = require('../../../repository/admin.repository');
jest.mock('../../../repository/admin.repository');

describe('Pruebas Unitarias - Admin Service (Funciones Reales)', () => {

    // éxito
    test('Debería retornar la lista de usuarios correctamente desde el repositorio', async () => {
        const mockUsuarios = [{ id: 1, email: 'admin@test.com', role: 'admin' }];
        adminRepo.getAllUsers.mockResolvedValue(mockUsuarios);

        const result = await adminService.getAllUsers({});
        expect(result).toEqual(mockUsuarios);
    });

    // error
    test('Debería propagar el error si el repositorio falla al obtener sucursales', async () => {
        adminRepo.getAllBranches.mockRejectedValue(new Error('Error de conexión con la BD'));

        await expect(adminService.getAllBranches()).rejects.toThrow('Error de conexión con la BD');
    });
});