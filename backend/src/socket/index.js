const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

function setupSocket(httpServer, services) {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST']
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000
    });

    const { store, bidService } = services;

    // Track ALL socket connections (not just unique users)
    // This allows counting multiple tabs/windows from same user
    const activeConnections = new Set(); // socket.id set
    const userSockets = new Map(); // userId -> Set of socket.ids (for targeted messaging)

    // Authentication middleware
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication token required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');

            socket.user = {
                id: decoded.userId,
                username: decoded.username
            };

            next();
        } catch (error) {
            next(new Error('Invalid authentication token'));
        }
    });

    io.on('connection', async (socket) => {
        const userId = socket.user.id;
        const username = socket.user.username;

        // Track this socket connection
        activeConnections.add(socket.id);

        // Track user's sockets for targeted messaging
        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);

        socket.join(`user_${userId}`);

        console.log(`🟢 ${username} connected (${activeConnections.size} bidders online)`);

        // Send initial data
        socket.emit('CONNECTED', {
            userId,
            username,
            serverTime: Date.now()
        });

        // Broadcast online count to ALL clients
        io.emit('ACTIVE_USERS', { count: activeConnections.size });

        // Handle BID_PLACED
        socket.on('BID_PLACED', async (data) => {
            const { itemId, bidAmount } = data;

            try {
                if (!itemId || !bidAmount || bidAmount <= 0) {
                    socket.emit('BID_ERROR', {
                        itemId,
                        error: 'Invalid bid data',
                        code: 'INVALID_INPUT'
                    });
                    return;
                }

                // Process bid atomically
                const result = await bidService.processBid(itemId, userId, bidAmount);

                if (!result.success) {
                    socket.emit('BID_ERROR', {
                        itemId,
                        error: result.error,
                        code: result.code
                    });
                    return;
                }

                const { auction, bid, previousBidder } = result.data;

                // Confirm to bidder
                socket.emit('BID_SUCCESS', {
                    itemId,
                    bid,
                    currentBid: auction.currentBid
                });

                // Broadcast to ALL clients
                io.emit('UPDATE_BID', {
                    itemId,
                    currentBid: auction.currentBid,
                    currentBidder: auction.currentBidder,
                    bidCount: auction.bids.length,
                    timestamp: bid.timestamp
                });

                // Notify previous bidder they were outbid
                if (previousBidder && previousBidder !== userId) {
                    io.to(`user_${previousBidder}`).emit('OUTBID_NOTIFICATION', {
                        itemId,
                        newBid: auction.currentBid,
                        yourBid: result.data.previousBid
                    });
                }

                // Check for anti-snipe extension
                if (services.timerService) {
                    await services.timerService.extendIfNeeded(itemId);
                }

                console.log(`💰 ${username} bid $${bidAmount} on ${itemId}`);

            } catch (error) {
                console.error('Bid error:', error);
                socket.emit('BID_ERROR', {
                    itemId,
                    error: 'Server error processing bid',
                    code: 'SERVER_ERROR'
                });
            }
        });

        // Handle time sync request
        socket.on('REQUEST_TIME_SYNC', () => {
            socket.emit('TIME_SYNC', {
                serverTime: Date.now()
            });
        });

        // Handle state sync request
        socket.on('REQUEST_STATE_SYNC', async (data) => {
            const auctions = await store.getAllAuctions();
            socket.emit('STATE_SYNC', {
                auctions: auctions.map(a => ({
                    id: a.id,
                    title: a.title,
                    currentBid: a.currentBid,
                    currentBidder: a.currentBidder,
                    endTime: a.endTime,
                    status: a.status,
                    bidCount: a.bids?.length || 0
                })),
                serverTime: Date.now()
            });
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            // Remove from active connections
            activeConnections.delete(socket.id);

            // Remove from user's socket set
            if (userSockets.has(userId)) {
                userSockets.get(userId).delete(socket.id);
                // Clean up empty user socket sets
                if (userSockets.get(userId).size === 0) {
                    userSockets.delete(userId);
                }
            }

            socket.leave(`user_${userId}`);

            io.emit('ACTIVE_USERS', { count: activeConnections.size });

            console.log(`🔴 ${username} disconnected (${activeConnections.size} bidders online)`);
        });
    });

    return io;
}

module.exports = setupSocket;
