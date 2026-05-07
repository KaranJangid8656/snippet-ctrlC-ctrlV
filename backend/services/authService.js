const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

const authService = {
    /**
     * Register a new user
     */
    async register({ name, email, password }) {
        // Check if email already exists
        const existing = await User.findOne({ email });
        if (existing) {
            throw new ErrorResponse('An account with this email already exists', 400);
        }

        const user = await User.create({ name, email, password });
        const token = user.getSignedJwtToken();
        return { user: { id: user._id, name: user.name, email: user.email }, token };
    },

    /**
     * Login an existing user
     */
    async login({ email, password }) {
        if (!email || !password) {
            throw new ErrorResponse('Please provide email and password', 400);
        }

        // Find user and include password for comparison
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            throw new ErrorResponse('Invalid credentials', 401);
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            throw new ErrorResponse('Invalid credentials', 401);
        }

        const token = user.getSignedJwtToken();
        return { user: { id: user._id, name: user.name, email: user.email }, token };
    },

    /**
     * Get logged-in user profile
     */
    async getMe(userId) {
        return await User.findById(userId);
    }
};

module.exports = authService;
