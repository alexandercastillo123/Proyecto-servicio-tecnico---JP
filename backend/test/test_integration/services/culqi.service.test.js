const culqiService = require('../../../services/culqi.service');
const sucursalRepo = require('../../../repository/sucursal.repository');

jest.mock('../../../repository/sucursal.repository');
jest.mock('axios');

describe('Pruebas Unitarias - Culqi Service (Funciones Reales)', () => {

    // éxito
    test('Debería retornar la llave pública pk_test configurada por defecto', () => {
        const publicKey = culqiService.getPublicKey();
        expect(publicKey).toContain('pk_test');
    });

    // error
    test('Debería lanzar un AppError 400 si se intenta pagar un pedido sin enviar el culqiToken', async () => {
        await expect(culqiService.payOrderCulqi(101, 1, null))
            .rejects.toThrow('Token de Culqi requerido.');
    });
});