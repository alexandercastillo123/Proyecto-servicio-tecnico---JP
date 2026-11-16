/**
 * Socket.IO Singleton Manager
 *
 * Solves the circular dependency problem where controllers need access
 * to the `io` instance that is created in server.js.
 *
 * Usage:
 *   In server.js: socketManager.setIO(io)
 *   In any module: const { getIO } = require('./config/socketManager'); getIO().emit(...)
 */

let _io = null;

/**
 * Store the Socket.IO server instance. Called once from server.js after creation.
 * @param {import('socket.io').Server} io
 */
const setIO = (io) => {
    _io = io;
};

/**
 * Retrieve the Socket.IO server instance.
 * Throws if called before setIO().
 * @returns {import('socket.io').Server}
 */
const getIO = () => {
    if (!_io) {
        throw new Error('Socket.IO has not been initialized. Call setIO(io) first.');
    }
    return _io;
};

module.exports = { setIO, getIO };
