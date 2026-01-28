const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const techniciansRoutes = require('./routes/technicians.routes');
const appointmentsRoutes = require('./routes/appointments.routes');
const messagesRoutes = require('./routes/messages.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/technicians', techniciansRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/messages', messagesRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║                                                       ║');
    console.log('║   🚀 Servicio Técnico J&P - Backend API Server       ║');
    console.log('║                                                       ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    console.log('');
    console.log('Available endpoints:');
    console.log('  GET  /health                          - Health check');
    console.log('  POST /api/auth/register               - Register user');
    console.log('  POST /api/auth/login                  - Login user');
    console.log('  GET  /api/users/profile               - Get profile (Auth)');
    console.log('  GET  /api/technicians                 - List technicians');
    console.log('  POST /api/appointments                - Create appointment (Auth)');
    console.log('  GET  /api/messages/conversations      - Get conversations (Auth)');
    console.log('');
    console.log('Press CTRL+C to stop the server');
    console.log('═══════════════════════════════════════════════════════');
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

module.exports = app;
