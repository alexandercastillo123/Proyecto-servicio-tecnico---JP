/**
 * Wraps an async Express route handler to automatically catch errors
 * and forward them to the global error handler middleware via next(err).
 * Eliminates repetitive try/catch blocks in every controller function.
 *
 * @param {Function} fn - Async express handler (req, res, next) => Promise
 * @returns {Function} Wrapped handler with automatic error forwarding
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
