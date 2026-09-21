/**
 * admin.service.test.js
 * Pruebas unitarias para admin.service.js
 */

jest.mock('../../repository/admin.repository');

const adminRepo = require('../../repository/admin.repository');
const adminService = require('../../services/admin.service');

describe('admin.service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllAppointments', () => {
        test('debería delegar la consulta de citas al repositorio con los filtros provistos', async () => {
            const filters = { status: 'pending', technicianId: 5 };
            const mockAppointments = [
                { id: 1, service_type: 'Reparación', status: 'pending' },
                { id: 2, service_type: 'Mantenimiento', status: 'pending' }
            ];
            adminRepo.getAllAppointments.mockResolvedValue(mockAppointments);

            const result = await adminService.getAllAppointments(filters);

            expect(adminRepo.getAllAppointments).toHaveBeenCalledWith(filters);
            expect(result).toEqual(mockAppointments);
        });

        test('debería propagar errores si el repositorio falla', async () => {
            adminRepo.getAllAppointments.mockRejectedValue(new Error('DB Error'));

            await expect(adminService.getAllAppointments({})).rejects.toThrow('DB Error');
        });
    });

    describe('getAllUsers', () => {
        test('debería delegar la consulta de usuarios al repositorio con los filtros provistos', async () => {
            const filters = { role: 'tech', search: 'Juan' };
            const mockUsers = [
                { id: 1, email: 'tech1@test.com', role: 'tech' },
                { id: 2, email: 'tech2@test.com', role: 'tech' }
            ];
            adminRepo.getAllUsers.mockResolvedValue(mockUsers);

            const result = await adminService.getAllUsers(filters);

            expect(adminRepo.getAllUsers).toHaveBeenCalledWith(filters);
            expect(result).toEqual(mockUsers);
        });
    });

    describe('getAllBranches', () => {
        test('debería delegar la consulta de todas las sucursales al repositorio', async () => {
            const mockBranches = [
                { id: 1, name: 'Sucursal Central', city: 'Lima' },
                { id: 2, name: 'Sucursal Norte', city: 'Trujillo' }
            ];
            adminRepo.getAllBranches.mockResolvedValue(mockBranches);

            const result = await adminService.getAllBranches();

            expect(adminRepo.getAllBranches).toHaveBeenCalled();
            expect(result).toEqual(mockBranches);
        });
    });

    describe('getAllOrders', () => {
        test('debería delegar la consulta de pedidos al repositorio con filtros', async () => {
            const filters = { payment_status: 'paid' };
            const mockOrders = [
                { id: 101, product_name: 'Pantalla iPhone 13', status: 'completed' }
            ];
            adminRepo.getAllOrders.mockResolvedValue(mockOrders);

            const result = await adminService.getAllOrders(filters);

            expect(adminRepo.getAllOrders).toHaveBeenCalledWith(filters);
            expect(result).toEqual(mockOrders);
        });
    });
});
