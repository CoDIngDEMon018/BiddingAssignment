import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './components/LoginForm';
import Header from './components/Header';
import ItemGrid from './components/ItemGrid';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { initSocket, disconnectSocket } from './utils/socket';
import api from './utils/api';

function App() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeOffset, setTimeOffset] = useState(0);
    const [toast, setToast] = useState(null);
    const [activeUsers, setActiveUsers] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Online/offline detection
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            showToast('Connection restored', 'success');
        };
        const handleOffline = () => {
            setIsOnline(false);
            showToast('You are offline', 'warning');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Check for existing auth on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('auction_token');
        const savedUser = localStorage.getItem('auction_user');

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        } else {
            setLoading(false);
        }
    }, []);

    // Fetch items and connect socket when authenticated
    useEffect(() => {
        if (!token) return;

        const fetchItems = async () => {
            try {
                const response = await api.get('/api/items');
                if (response.data.success) {
                    setItems(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch items:', error);
                showToast('Failed to load auctions', 'error');
            } finally {
                setLoading(false);
            }
        };

        const syncTime = async () => {
            try {
                const response = await api.get('/api/time');
                const serverTime = response.data.data.serverTime;
                const clientTime = Date.now();
                setTimeOffset(serverTime - clientTime);
            } catch (error) {
                console.error('Failed to sync time:', error);
            }
        };

        fetchItems();
        syncTime();

        // Initialize socket connection
        const socket = initSocket(token);

        socket.on('connect', () => {
            console.log('Connected to auction server');
            showToast('Connected to live auction', 'success');
        });

        socket.on('disconnect', () => {
            showToast('Disconnected from server', 'warning');
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            showToast('Connection error. Retrying...', 'error');
        });

        socket.on('TIME_SYNC', (data) => {
            const clientTime = Date.now();
            setTimeOffset(data.serverTime - clientTime);
        });

        socket.on('ACTIVE_USERS', (data) => {
            setActiveUsers(data.count);
        });

        socket.on('UPDATE_BID', (data) => {
            setItems(prev => prev.map(item =>
                item.id === data.itemId
                    ? {
                        ...item,
                        currentBid: data.currentBid,
                        currentBidder: data.currentBidder,
                        bidCount: data.bidCount
                    }
                    : item
            ));
        });

        socket.on('AUCTION_END', (data) => {
            setItems(prev => prev.map(item =>
                item.id === data.itemId
                    ? { ...item, status: 'ended' }
                    : item
            ));

            if (data.winner === user?.id) {
                showToast(`🎉 You won the auction for $${data.finalBid}!`, 'success');
            }
        });

        socket.on('AUCTION_EXTENDED', (data) => {
            setItems(prev => prev.map(item =>
                item.id === data.itemId
                    ? { ...item, endTime: data.newEndTime }
                    : item
            ));
            showToast('⏰ Auction extended by 30 seconds!', 'info');
        });

        socket.on('BID_SUCCESS', (data) => {
            showToast(`✓ Bid of $${data.currentBid} placed!`, 'success');
        });

        socket.on('BID_ERROR', (data) => {
            // Only show toast for non-rate-limited errors (card shows inline)
            if (data.code !== 'RATE_LIMITED' && data.code !== 'BID_IN_PROGRESS') {
                showToast(data.error, 'error');
            }
        });

        socket.on('OUTBID_NOTIFICATION', (data) => {
            showToast(`You were outbid! New bid: $${data.newBid}`, 'warning');
        });

        // Request time sync periodically
        const timeSyncInterval = setInterval(() => {
            socket.emit('REQUEST_TIME_SYNC');
        }, 60000);

        return () => {
            clearInterval(timeSyncInterval);
            disconnectSocket();
        };
    }, [token, user?.id]);

    // Optimistic update handler - immediate UI feedback
    const handleOptimisticBid = useCallback((itemId, newBid, userId) => {
        setItems(prev => prev.map(item =>
            item.id === itemId
                ? {
                    ...item,
                    currentBid: newBid,
                    currentBidder: userId,
                    bidCount: (item.bidCount || 0) + 1
                }
                : item
        ));
    }, []);

    const handleLogin = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('auction_token', authToken);
        localStorage.setItem('auction_user', JSON.stringify(userData));
    };

    const handleLogout = () => {
        setUser(null);
        setToken(null);
        setItems([]);
        localStorage.removeItem('auction_token');
        localStorage.removeItem('auction_user');
        disconnectSocket();
    };

    const showToast = useCallback((message, type = 'info') => {
        setToast({ message, type, id: Date.now() });
    }, []);

    const clearToast = useCallback(() => {
        setToast(null);
    }, []);

    // Auto-clear toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    if (!token) {
        return (
            <ErrorBoundary>
                <div className="animated-bg" />
                <LoginForm onLogin={handleLogin} />
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
            <div className="animated-bg" />

            {/* Offline Banner */}
            {!isOnline && (
                <div className="fixed top-0 left-0 right-0 bg-outbid text-white text-center py-2 z-50 text-sm font-semibold">
                    ⚠️ You are offline. Bids will not be processed.
                </div>
            )}

            <div className={`min-h-screen ${!isOnline ? 'pt-10' : ''}`}>
                <Header
                    user={user}
                    onLogout={handleLogout}
                    activeUsers={activeUsers}
                />

                <main className="container py-8">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="glass-card h-[400px] skeleton" />
                            ))}
                        </div>
                    ) : (
                        <ItemGrid
                            items={items}
                            currentUserId={user?.id}
                            timeOffset={timeOffset}
                            token={token}
                            onOptimisticBid={handleOptimisticBid}
                        />
                    )}
                </main>
            </div>

            <AnimatePresence>
                {toast && (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={clearToast}
                    />
                )}
            </AnimatePresence>
        </ErrorBoundary>
    );
}

export default App;
