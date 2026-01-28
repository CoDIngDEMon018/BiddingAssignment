const fs = require('fs').promises;
const path = require('path');

class InMemoryStore {
    constructor() {
        this.auctions = new Map();
        this.users = new Map();
        this.persistencePath = path.join(__dirname, '../../data');
    }

    // Auction operations
    async getAuction(id) {
        return this.auctions.get(id);
    }

    async getAllAuctions() {
        return Array.from(this.auctions.values());
    }

    async updateAuction(id, data) {
        this.auctions.set(id, data);
        return data;
    }

    async createAuction(data) {
        const id = data.id || `auction_${Date.now()}`;
        const auction = {
            ...data,
            id,
            bids: [],
            createdAt: Date.now()
        };
        this.auctions.set(id, auction);
        return auction;
    }

    // User operations
    async getUser(id) {
        return this.users.get(id);
    }

    async getUserByUsername(username) {
        return Array.from(this.users.values())
            .find(u => u.username === username);
    }

    async createUser(data) {
        const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const user = {
            ...data,
            id,
            createdAt: Date.now()
        };
        this.users.set(id, user);
        return user;
    }

    // Persistence
    async save() {
        try {
            await fs.mkdir(this.persistencePath, { recursive: true });

            const data = {
                auctions: Array.from(this.auctions.entries()),
                users: Array.from(this.users.entries()),
                savedAt: Date.now()
            };

            await fs.writeFile(
                path.join(this.persistencePath, 'data.json'),
                JSON.stringify(data, null, 2)
            );

            console.log('💾 Data saved to disk');
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    async load() {
        try {
            const filePath = path.join(this.persistencePath, 'data.json');
            const content = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(content);

            this.auctions = new Map(data.auctions || []);
            this.users = new Map(data.users || []);

            console.log(`📂 Loaded ${this.auctions.size} auctions, ${this.users.size} users`);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Error loading data:', error);
            }
        }
    }
}

module.exports = InMemoryStore;
