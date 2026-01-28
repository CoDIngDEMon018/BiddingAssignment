class BidService {
    constructor(store) {
        this.store = store;
        this.bidLocks = new Map(); // In-memory locks per item
        this.userRateLimits = new Map(); // userId -> [timestamps] for rate limiting
        this.MAX_BIDS_PER_WINDOW = 5; // Max 5 bids per 10 seconds
        this.RATE_LIMIT_WINDOW = 10000; // 10 seconds
    }

    /**
     * Rate limiting check per user
     * Prevents spam bidding
     */
    checkRateLimit(userId) {
        const now = Date.now();

        if (!this.userRateLimits.has(userId)) {
            this.userRateLimits.set(userId, []);
        }

        const userBids = this.userRateLimits.get(userId);

        // Remove bids older than rate limit window
        const recentBids = userBids.filter(t => now - t < this.RATE_LIMIT_WINDOW);

        if (recentBids.length >= this.MAX_BIDS_PER_WINDOW) {
            return {
                allowed: false,
                retryAfter: Math.ceil((recentBids[0] + this.RATE_LIMIT_WINDOW - now) / 1000)
            };
        }

        // Record this bid attempt
        recentBids.push(now);
        this.userRateLimits.set(userId, recentBids);

        return { allowed: true };
    }

    /**
     * Enhanced input validation
     */
    validateInput(itemId, userId, bidAmount) {
        // Check types
        if (typeof itemId !== 'string' || itemId.trim() === '') {
            return { valid: false, error: 'Invalid item ID', code: 'INVALID_ITEM_ID' };
        }

        if (typeof userId !== 'string' || userId.trim() === '') {
            return { valid: false, error: 'Invalid user ID', code: 'INVALID_USER_ID' };
        }

        if (typeof bidAmount !== 'number' || isNaN(bidAmount)) {
            return { valid: false, error: 'Bid amount must be a number', code: 'INVALID_BID_TYPE' };
        }

        // Check bid range
        if (bidAmount <= 0) {
            return { valid: false, error: 'Bid must be positive', code: 'NEGATIVE_BID' };
        }

        if (bidAmount > 10000000) { // $10M max
            return { valid: false, error: 'Bid exceeds maximum allowed', code: 'BID_TOO_HIGH' };
        }

        // Check for integer (no fractional cents)
        if (!Number.isInteger(bidAmount)) {
            return { valid: false, error: 'Bid must be a whole number', code: 'FRACTIONAL_BID' };
        }

        return { valid: true };
    }

    /**
     * Process bid with atomic validation
     * CRITICAL: This prevents race conditions
     */
    async processBid(itemId, userId, bidAmount) {
        // Step 1: Input validation
        const inputValidation = this.validateInput(itemId, userId, bidAmount);
        if (!inputValidation.valid) {
            return {
                success: false,
                error: inputValidation.error,
                code: inputValidation.code
            };
        }

        // Step 2: Rate limiting check
        const rateCheck = this.checkRateLimit(userId);
        if (!rateCheck.allowed) {
            return {
                success: false,
                error: `Too many bids. Try again in ${rateCheck.retryAfter}s`,
                code: 'RATE_LIMITED'
            };
        }

        // Step 3: Check if bid is already being processed for this item
        if (this.bidLocks.has(itemId)) {
            return {
                success: false,
                error: 'Another bid is being processed',
                code: 'BID_IN_PROGRESS'
            };
        }

        // Step 4: Acquire lock
        this.bidLocks.set(itemId, {
            acquiredAt: Date.now(),
            userId
        });

        try {
            // Step 5: Validate bid (business rules)
            const validation = await this.validateBid(itemId, userId, bidAmount);

            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.error,
                    code: validation.code
                };
            }

            // Step 6: Execute atomic update
            const result = await this.executeBid(itemId, userId, bidAmount);

            return {
                success: true,
                data: result
            };

        } catch (error) {
            console.error('Bid processing error:', error);
            return {
                success: false,
                error: 'Failed to process bid',
                code: 'PROCESSING_ERROR'
            };
        } finally {
            // ALWAYS release lock
            this.bidLocks.delete(itemId);
        }
    }

    /**
     * Validate bid (business rules)
     */
    async validateBid(itemId, userId, bidAmount) {
        const auction = await this.store.getAuction(itemId);

        // Check auction exists
        if (!auction) {
            return {
                isValid: false,
                error: 'Auction not found',
                code: 'AUCTION_NOT_FOUND'
            };
        }

        // Check auction is active
        if (auction.status !== 'active') {
            return {
                isValid: false,
                error: 'Auction has ended',
                code: 'AUCTION_ENDED'
            };
        }

        // Check time hasn't expired
        const now = Date.now();
        if (now >= auction.endTime) {
            return {
                isValid: false,
                error: 'Auction time has expired',
                code: 'AUCTION_EXPIRED'
            };
        }

        // Check bid is higher than current
        if (bidAmount <= auction.currentBid) {
            return {
                isValid: false,
                error: `Bid must be higher than $${auction.currentBid}`,
                code: 'BID_TOO_LOW'
            };
        }

        // Check user isn't already highest bidder
        if (auction.currentBidder === userId) {
            return {
                isValid: false,
                error: 'You are already the highest bidder',
                code: 'ALREADY_HIGHEST_BIDDER'
            };
        }

        return { isValid: true };
    }

    /**
     * Execute the bid update atomically
     */
    async executeBid(itemId, userId, bidAmount) {
        const auction = await this.store.getAuction(itemId);

        // Create bid record
        const bid = {
            id: `bid_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            userId,
            itemId,
            amount: bidAmount,
            timestamp: Date.now()
        };

        // Store previous values for notification
        const previousBid = auction.currentBid;
        const previousBidder = auction.currentBidder;

        // Update auction atomically
        auction.currentBid = bidAmount;
        auction.currentBidder = userId;
        auction.bids.push(bid);
        auction.updatedAt = Date.now();

        // Persist changes
        await this.store.updateAuction(itemId, auction);

        return {
            auction,
            bid,
            previousBid,
            previousBidder
        };
    }
}

module.exports = BidService;
