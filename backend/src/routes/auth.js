const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// POST /auth/login - Simple username-only login
router.post('/login', async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || username.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Username must be at least 2 characters',
                    code: 'INVALID_USERNAME'
                }
            });
        }

        const trimmedUsername = username.trim().toLowerCase();
        const { store } = req.app.locals.services;

        // Find or create user
        let user = await store.getUserByUsername(trimmedUsername);

        if (!user) {
            user = await store.createUser({
                username: trimmedUsername,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${trimmedUsername}`
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: process.env.JWT_EXPIRY || '24h' }
        );

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    avatar: user.avatar
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Login failed',
                code: 'LOGIN_ERROR'
            }
        });
    }
});

// GET /auth/verify - Verify token
router.get('/verify', (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: { message: 'No token provided', code: 'NO_TOKEN' }
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');

        res.json({
            success: true,
            data: {
                userId: decoded.userId,
                username: decoded.username
            }
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            error: { message: 'Invalid token', code: 'INVALID_TOKEN' }
        });
    }
});

module.exports = router;
