const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Servicio Técnico J&P API',
      version: '1.0.0',
      description: 'API para la aplicación de Servicio Técnico J&P (Móvil y Web)',
      contact: {
        name: 'Soporte J&P'
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor Local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js'], // Archivos donde buscar anotaciones
};

const specs = swaggerJsdoc(options);
module.exports = specs;
