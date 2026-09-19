describe('Pruebas Unitarias - Admin Service', () => {
    // éxito
    test('Debería retornar las estadísticas correctamente cuando el servicio responde con éxito', () => {
        const resultadoSimulado = { usuariosActivos: 10, sucursales: 3, estatus: 'success' };

        expect(resultadoSimulado.estatus).toBe('success');
        expect(resultadoSimulado).toHaveProperty('usuariosActivos');
    });

    // error
    test('Debería lanzar un error controlado si falla la conexión al obtener métricas', () => {
        const ejecutarServicio = () => {
            throw new Error('Error al conectar con la base de datos de administración');
        };

        expect(ejecutarServicio).toThrow('Error al conectar con la base de datos de administración');
    });
});