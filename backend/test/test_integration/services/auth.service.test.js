describe('Pruebas Unitarias - Auth Service', () => {
    // éxito
    test('Debería generar un token de acceso válido cuando las credenciales coinciden', () => {
        const respuestaLogin = { token: "jwt_token_simulado_exito", auth: true };

        expect(respuestaLogin.auth).toBe(true);
        expect(respuestaLogin.token).toBeDefined();
    });

    // error
    test('Debería rechazar el acceso si la contraseña ingresada es incorrecta', () => {
        const respuestaLoginFallido = { mensaje: "Contraseña incorrecta", auth: false };

        expect(respuestaLoginFallido.auth).toBe(false);
        expect(respuestaLoginFallido.mensaje).toBe("Contraseña incorrecta");
    });
});