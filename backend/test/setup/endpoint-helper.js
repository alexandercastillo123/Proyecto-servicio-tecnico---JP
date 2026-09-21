/**
 * endpoint-helper.js
 * Helpers y configuración compartida para pruebas de endpoints con Supertest
 */
const request = require('supertest');
const { app } = require('../../server');
const { generateToken } = require('../../utils/jwt');

const createTestToken = (payload = {}) => {
    return generateToken({
        id: payload.id || 1,
        email: payload.email || 'test@example.com',
        username: payload.username || 'testuser',
        role: payload.role || 'client',
        ...payload
    });
};

const clientToken = createTestToken({ id: 10, email: 'client@test.com', role: 'client', username: 'cliente1' });
const techToken = createTestToken({ id: 20, email: 'tech@test.com', role: 'tech', username: 'tecnico1' });
const adminToken = createTestToken({ id: 30, email: 'admin@test.com', role: 'admin', username: 'admin1' });

const authHeader = (token) => ({
    Authorization: `Bearer ${token}`
});

module.exports = {
    request,
    app,
    createTestToken,
    clientToken,
    techToken,
    adminToken,
    authHeader
};
