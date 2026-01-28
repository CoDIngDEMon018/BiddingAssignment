class TimerService {
    constructor(store, io) {
        this.store = store;
        this.io = io;
        this.timers = new Map(); // itemId -> timeout reference
        this.intervals = new Map(); // itemId -> interval for countdown broadcasts
    }

    /**
     * Initialize all active auction timers
     */
    async initializeTimers() {
        const auctions = await this.store.getAllAuctions();

        for (const auction of auctions) {
            if (auction.status === 'active') {
                this.startTimer(auction.id, auction.endTime);
            }
        }

        console.log(`⏰ Initialized ${this.timers.size} auction timers`);
    }

    /**
     * Start timer for an auction
     */
    startTimer(itemId, endTime) {
        const now = Date.now();
        const timeRemaining = endTime - now;

        if (timeRemaining <= 0) {
            this.endAuction(itemId);
            return;
        }

        // Set timeout for auction end
        const timeout = setTimeout(() => {
            this.endAuction(itemId);
        }, timeRemaining);

        this.timers.set(itemId, timeout);

        // Start countdown broadcasts for final 60 seconds
        if (timeRemaining <= 60000) {
            this.startCountdownBroadcast(itemId, endTime);
        } else {
            // Schedule countdown start for when 60 seconds remain
            const broadcastDelay = timeRemaining - 60000;
            setTimeout(() => {
                this.startCountdownBroadcast(itemId, endTime);
            }, broadcastDelay);
        }
    }

    /**
     * Broadcast countdown every second for final minute
     */
    startCountdownBroadcast(itemId, endTime) {
        if (this.intervals.has(itemId)) return;

        const interval = setInterval(() => {
            const remaining = endTime - Date.now();

            if (remaining <= 0) {
                clearInterval(interval);
                this.intervals.delete(itemId);
                return;
            }

            this.io.emit('COUNTDOWN_UPDATE', {
                itemId,
                timeRemaining: remaining,
                serverTime: Date.now()
            });
        }, 1000);

        this.intervals.set(itemId, interval);
    }

    /**
     * End auction and declare winner
     */
    async endAuction(itemId) {
        try {
            const auction = await this.store.getAuction(itemId);

            if (!auction || auction.status !== 'active') {
                return;
            }

            // Update auction status
            auction.status = 'ended';
            auction.endedAt = Date.now();

            await this.store.updateAuction(itemId, auction);

            // Clear timers
            this.cancelTimer(itemId);

            // Broadcast auction end
            this.io.emit('AUCTION_END', {
                itemId,
                winner: auction.currentBidder,
                finalBid: auction.currentBid,
                timestamp: auction.endedAt
            });

            console.log(`🔔 Auction ${itemId} ended. Winner: ${auction.currentBidder || 'None'}, Bid: $${auction.currentBid}`);

        } catch (error) {
            console.error(`Error ending auction ${itemId}:`, error);
        }
    }

    /**
     * Cancel timer
     */
    cancelTimer(itemId) {
        const timeout = this.timers.get(itemId);
        const interval = this.intervals.get(itemId);

        if (timeout) clearTimeout(timeout);
        if (interval) clearInterval(interval);

        this.timers.delete(itemId);
        this.intervals.delete(itemId);
    }

    /**
     * Extend auction time (anti-snipe feature)
     * If bid placed in last 30 seconds, extend by 30 seconds
     */
    async extendIfNeeded(itemId) {
        const auction = await this.store.getAuction(itemId);
        const timeRemaining = auction.endTime - Date.now();

        if (timeRemaining < 30000 && timeRemaining > 0) {
            const newEndTime = auction.endTime + 30000;
            auction.endTime = newEndTime;

            await this.store.updateAuction(itemId, auction);

            // Restart timer
            this.cancelTimer(itemId);
            this.startTimer(itemId, newEndTime);

            // Notify clients
            this.io.emit('AUCTION_EXTENDED', {
                itemId,
                newEndTime,
                extensionSeconds: 30
            });

            return true;
        }

        return false;
    }
}

module.exports = TimerService;
