class UserService {
    constructor(store) {
        this.store = store;
    }

    async getUser(userId) {
        return this.store.getUser(userId);
    }

    async getUserByUsername(username) {
        return this.store.getUserByUsername(username);
    }

    async createUser(userData) {
        return this.store.createUser(userData);
    }

    async getUserBids(userId) {
        const auctions = await this.store.getAllAuctions();
        const userBids = [];

        for (const auction of auctions) {
            const bids = auction.bids.filter(b => b.userId === userId);
            if (bids.length > 0) {
                userBids.push({
                    auctionId: auction.id,
                    auctionTitle: auction.title,
                    bids,
                    isWinning: auction.currentBidder === userId,
                    status: auction.status
                });
            }
        }

        return userBids;
    }
}

module.exports = UserService;
