class Respuesta {
    constructor() {
        this.exito = false;
        this.estado = 400;
        this.mensaje = '';
        this.resultado = null;
    }

    /**
     * Create a successful response object
     * @param {*} data - Result payload
     * @param {string} [msg='Éxito'] - Success message
     * @param {number} [status=200] - HTTP status code
     * @returns {Respuesta}
     */
    static ok(data = null, msg = 'Éxito', status = 200) {
        const r = new Respuesta();
        r.exito = true;
        r.estado = status;
        r.mensaje = msg;
        r.resultado = data;
        return r;
    }

    /**
     * Create a failure response object
     * @param {string} msg - Error message
     * @param {number} [status=400] - HTTP status code
     * @returns {Respuesta}
     */
    static fail(msg, status = 400) {
        const r = new Respuesta();
        r.exito = false;
        r.estado = status;
        r.mensaje = msg;
        r.resultado = null;
        return r;
    }
}

module.exports = Respuesta;
