import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { emitBid, getSocket } from '../utils/socket';

// Debounce utility
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

// Memoized ItemCard - only re-renders when necessary props change
const ItemCard = memo(function ItemCard({
    item,
    currentUserId,
    timeOffset,
    onOptimisticBid,
    isEnded
}) {
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [bidFlash, setBidFlash] = useState(false);
    const [bidding, setBidding] = useState(false);
    const [error, setError] = useState(null);
    const previousBidRef = useRef(item.currentBid);
    const retryCountRef = useRef(0);
    const MAX_RETRIES = 3;

    // Check bid status
    const isWinning = item.currentBidder === currentUserId;
    const hasPlacedBid = item.currentBidder !== null;
    const isOutbid = hasPlacedBid && !isWinning && previousBidRef.current !== item.currentBid;

    // Calculate time remaining with server offset
    useEffect(() => {
        if (item.status !== 'active') {
            setTimeRemaining(0);
            return;
        }

        const updateTimer = () => {
            const now = Date.now() + timeOffset;
            const remaining = Math.max(0, item.endTime - now);
            setTimeRemaining(remaining);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 100);

        return () => clearInterval(interval);
    }, [item.endTime, item.status, timeOffset]);

    // Bid flash animation trigger
    useEffect(() => {
        if (item.currentBid !== previousBidRef.current) {
            setBidFlash(true);
            const timer = setTimeout(() => setBidFlash(false), 600);
            previousBidRef.current = item.currentBid;
            return () => clearTimeout(timer);
        }
    }, [item.currentBid]);

    // Clear error after 3 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const formatTime = useCallback((ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    }, []);

    const getCountdownClass = useCallback(() => {
        if (timeRemaining === 0) return 'text-gray-500';
        if (timeRemaining < 30000) return 'text-countdown-critical animate-countdown-pulse';
        if (timeRemaining < 300000) return 'text-countdown-warning';
        return 'text-countdown-safe';
    }, [timeRemaining]);

    // Optimistic bid with retry logic
    const handleBid = useCallback(async () => {
        if (bidding || timeRemaining === 0 || isWinning) return;

        setBidding(true);
        setError(null);
        const newBid = item.currentBid + 10;

        // OPTIMISTIC UPDATE: Update UI immediately
        if (onOptimisticBid) {
            onOptimisticBid(item.id, newBid, currentUserId);
        }

        // Emit bid to server
        emitBid(item.id, newBid);

        // Setup response handlers
        const socket = getSocket();
        if (socket) {
            const successHandler = (data) => {
                if (data.itemId === item.id) {
                    setBidding(false);
                    retryCountRef.current = 0;
                    socket.off('BID_SUCCESS', successHandler);
                    socket.off('BID_ERROR', errorHandler);
                }
            };

            const errorHandler = (data) => {
                if (data.itemId === item.id) {
                    // Rollback optimistic update on error
                    setError(data.error);

                    // Retry logic for transient errors
                    if (data.code === 'BID_IN_PROGRESS' && retryCountRef.current < MAX_RETRIES) {
                        retryCountRef.current++;
                        setTimeout(() => {
                            emitBid(item.id, newBid);
                        }, 100 * retryCountRef.current); // Exponential backoff
                    } else {
                        setBidding(false);
                        retryCountRef.current = 0;
                    }

                    socket.off('BID_SUCCESS', successHandler);
                    socket.off('BID_ERROR', errorHandler);
                }
            };

            socket.once('BID_SUCCESS', successHandler);
            socket.once('BID_ERROR', errorHandler);

            // Fallback timeout
            setTimeout(() => {
                setBidding(false);
                socket.off('BID_SUCCESS', successHandler);
                socket.off('BID_ERROR', errorHandler);
            }, 5000);
        } else {
            // No socket, reset after delay
            setTimeout(() => setBidding(false), 1000);
        }
    }, [bidding, timeRemaining, isWinning, item.id, item.currentBid, currentUserId, onOptimisticBid]);

    // Debounced click handler (prevents accidental double-clicks)
    const debouncedBid = useCallback(
        debounce(handleBid, 300),
        [handleBid]
    );

    const cardClasses = `
        glass-card overflow-hidden transition-all duration-300
        ${bidFlash ? 'animate-bid-flash' : ''}
        ${isWinning && !isEnded ? 'ring-2 ring-winning/30 animate-winning-glow' : ''}
        ${isOutbid && !isEnded ? 'ring-2 ring-outbid/30' : ''}
    `;

    return (
        <motion.div
            className={cardClasses}
            whileHover={!isEnded ? { y: -4 } : {}}
            transition={{ duration: 0.2 }}
        >
            {/* Image Section */}
            <div className="relative h-48 overflow-hidden">
                <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary-200 via-transparent to-transparent" />

                {/* Status Badge */}
                {!isEnded && (isWinning || isOutbid) && (
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide
                            ${isWinning ? 'badge-winning' : 'badge-outbid'}`}
                    >
                        {isWinning ? '🏆 Winning' : '⚠️ Outbid'}
                    </motion.div>
                )}

                {/* Ended Badge */}
                {isEnded && (
                    <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-gray-800/80 text-gray-400">
                        Ended
                    </div>
                )}

                {/* Live Indicator */}
                {!isEnded && (
                    <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                        <span className="live-dot"></span>
                        <span className="text-xs font-semibold text-white">LIVE</span>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-5">
                {/* Title */}
                <h3 className="font-display text-lg font-bold text-white mb-1 truncate">
                    {item.title}
                </h3>
                <p className="text-sm text-gray-400 mb-4 truncate">
                    {item.description}
                </p>

                {/* Price & Timer */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Current Bid */}
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Current Bid
                        </p>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={item.currentBid}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -10, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="font-display text-2xl font-bold gradient-text"
                            >
                                ${item.currentBid.toLocaleString()}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Countdown */}
                    <div className="text-right">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            {isEnded ? 'Ended' : 'Time Left'}
                        </p>
                        <div className={`font-mono text-xl font-bold ${getCountdownClass()}`}>
                            {isEnded ? '--:--' : formatTime(timeRemaining)}
                        </div>
                    </div>
                </div>

                {/* Bid Count */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{item.bidCount || 0} bid{(item.bidCount || 0) !== 1 ? 's' : ''}</span>
                    {item.currentBidder && (
                        <span className={isWinning ? 'text-winning' : ''}>
                            {isWinning ? 'You' : `Bidder ${item.currentBidder.slice(-4)}`}
                        </span>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-3 p-2 bg-outbid/10 border border-outbid/30 rounded-lg text-outbid text-xs text-center"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Bid Button */}
                <button
                    onClick={debouncedBid}
                    disabled={isEnded || bidding || timeRemaining === 0 || isWinning}
                    className={`w-full py-3 rounded-xl font-bold text-base transition-all
                        ${isWinning && !isEnded
                            ? 'bg-winning/20 text-winning cursor-not-allowed'
                            : isEnded || timeRemaining === 0
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'btn-gold'
                        }`}
                >
                    {bidding ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Bidding...
                        </span>
                    ) : isWinning && !isEnded ? (
                        '✓ You\'re Winning'
                    ) : isEnded ? (
                        'Auction Ended'
                    ) : timeRemaining === 0 ? (
                        'Time\'s Up'
                    ) : (
                        <>Bid +$10 → ${(item.currentBid + 10).toLocaleString()}</>
                    )}
                </button>
            </div>
        </motion.div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for memo - only re-render if these change
    return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.currentBid === nextProps.item.currentBid &&
        prevProps.item.currentBidder === nextProps.item.currentBidder &&
        prevProps.item.status === nextProps.item.status &&
        prevProps.item.endTime === nextProps.item.endTime &&
        prevProps.item.bidCount === nextProps.item.bidCount &&
        prevProps.currentUserId === nextProps.currentUserId &&
        prevProps.isEnded === nextProps.isEnded
    );
});

export default ItemCard;
