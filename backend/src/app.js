const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const itemsRoutes = require('./routes/items');
const metricsRoutes = require('./routes/metrics');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// API routes
app.use('/auth', authRoutes);
app.use('/api', itemsRoutes);
app.use('/api', metricsRoutes);

// Export metrics recorder for socket handlers
app.metricsRecorder = metricsRoutes;

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.statusCode || 500).json({
        success: false,
        error: {
            message: err.message || 'Internal server error',
            code: err.code || 'INTERNAL_ERROR'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: 'Route not found',
            code: 'NOT_FOUND'
        }
    });
});

module.exports = app;
