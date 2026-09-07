const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const { setIO } = require('./config/socketManager');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const techniciansRoutes = require('./routes/technicians.routes');
const appointmentsRoutes = require('./routes/appointments.routes');
const messagesRoutes = require('./routes/messages.routes');
const sucursalesRoutes = require('./routes/sucursales.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const culqiRoutes = require('./routes/culqi.routes');
const appointmentManager = require('./utils/appointmentManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Register io in the singleton manager so controllers can access it
// without creating circular dependencies via require('../server')
setIO(io);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Servir archivos subidos estáticamente
app.use('/uploads', express.static('uploads'));

// Punto de verificación de salud (Health check)
app.get('/health', (req, res) => {
    res.json({
        success: true,
        mensaje: 'El servidor está funcionando',
        timestamp: new Date().toISOString()
    });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/technicians', techniciansRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/sucursales', sucursalesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/culqi', culqiRoutes);

// Manejador de ruta no encontrada (404)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        mensaje: 'Endpoint no encontrado'
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Socket.io connection logic
io.on('connection', (socket) => {
    console.log(`📡 Nuevo cliente conectado: ${socket.id}`);

    socket.on('join_room', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`👤 Usuario ${userId} se unió a su sala privada`);
    });

    socket.on('send_message', (data) => {
        // Enviar a la sala del destinatario
        io.to(`user_${data.receiverId}`).emit('receive_message', data);
        console.log(`✉️ Mensaje enviado de ${data.senderId} a ${data.receiverId}`);
    });

    socket.on('disconnect', () => {
        console.log('🔌 Cliente desconectado');
    });
});

// Iniciar servidor
server.listen(PORT, '0.0.0.0', () => {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║                                                       ║');
    console.log('║   🚀 Servicio Técnico J&P - Servidor Backend API      ║');
    console.log('║                                                       ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📡 Servidor ejecutándose en: http://localhost:${PORT}`);
    console.log(`📖 Documentación API: http://localhost:${PORT}/api-docs`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ Iniciado en: ${new Date().toLocaleString()}`);
    console.log('');
    console.log('Endpoints principales:');
    console.log('  GET  /health                          - Health check');
    console.log('  POST /api/auth/login                  - Iniciar sesión');
    console.log('  GET  /api-docs                        - Documentación Swagger');
    console.log('');
    console.log('Presione CTRL+C para detener el servidor');
    console.log('═══════════════════════════════════════════════════════');
    
    // Iniciar tareas automatizadas
    appointmentManager.startAppointmentAutomation();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT signal received: closing HTTP server');
    process.exit(0);
});

module.exports = { app, server, io };

