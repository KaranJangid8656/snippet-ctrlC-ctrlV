const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('./asyncHandler');

/**
 * Middleware to protect routes — requires a valid Bearer JWT token
 */
const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return next(new ErrorResponse('User no longer exists', 401));
        }

        next();
    } catch {
        return next(new ErrorResponse('Not authorized, token failed', 401));
    }
});

/**
 * Optional auth — attaches user to req if token exists, but doesn't block if absent.
 * Used for routes that work for both logged-in and anonymous users.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id);
        } catch {
            // Token invalid, proceed as anonymous
            req.user = null;
        }
    }

    next();
});

module.exports = { protect, optionalAuth };
