/**
 * Middleware to handle async routes and pass errors to global handler
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
