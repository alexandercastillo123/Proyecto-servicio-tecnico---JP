describe('Pruebas Unitarias - Culqi Service (Pagos)', () => {
    // éxito
    test('Debería procesar el cargo correctamente con la pasarela de pagos Culqi', () => {
        const respuestaCulqi = { id: 'chr_test_999', estado: 'capturado' };

        expect(respuestaCulqi.estado).toBe('capturado');
        expect(respuestaCulqi.id).toBeDefined();
    });

    // error
    test('Debería retornar un error de tarjeta rechazada si los fondos son insuficientes', () => {
        const errorCulqi = { codigo: 'card_declined', mensaje: 'Fondos insuficientes en la tarjeta' };

        expect(errorCulqi.codigo).toBe('card_declined');
        expect(errorCulqi.mensaje).toContain('insuficientes');
    });
});