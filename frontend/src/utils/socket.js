import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (token) => {
    if (socket) {
        socket.disconnect();
    }

    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    socket = io(serverUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const emitBid = (itemId, bidAmount) => {
    if (socket) {
        socket.emit('BID_PLACED', { itemId, bidAmount });
    }
};
