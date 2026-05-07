const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const snippetRoutes = require('./routes/snippets');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/snippetsaver';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/snippets', snippetRoutes);

// Error Middleware (must be after routes)
app.use(errorHandler);

// Health check
app.get('/', (req, res) => {
    res.json({ message: '✅ Snippet Saver API is running!' });
});

// Connect to MongoDB and start server
mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });
