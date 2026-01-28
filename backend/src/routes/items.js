const express = require('express');
const router = express.Router();

// GET /api/items - Get all auction items
router.get('/items', async (req, res) => {
    try {
        const { store } = req.app.locals.services;
        const auctions = await store.getAllAuctions();

        // Sort by end time (soonest first)
        const sorted = auctions.sort((a, b) => a.endTime - b.endTime);

        res.json({
            success: true,
            data: sorted.map(auction => ({
                id: auction.id,
                title: auction.title,
                description: auction.description,
                imageUrl: auction.imageUrl,
                startingPrice: auction.startingPrice,
                currentBid: auction.currentBid,
                currentBidder: auction.currentBidder,
                bidCount: auction.bids?.length || 0,
                endTime: auction.endTime,
                status: auction.status
            }))
        });

    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch items',
                code: 'FETCH_ERROR'
            }
        });
    }
});

// GET /api/items/:id - Get single auction with full details
router.get('/items/:id', async (req, res) => {
    try {
        const { store } = req.app.locals.services;
        const auction = await store.getAuction(req.params.id);

        if (!auction) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Auction not found',
                    code: 'NOT_FOUND'
                }
            });
        }

        res.json({
            success: true,
            data: auction
        });

    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch item',
                code: 'FETCH_ERROR'
            }
        });
    }
});

// GET /api/time - Get server time for synchronization
router.get('/time', (req, res) => {
    res.json({
        success: true,
        data: {
            serverTime: Date.now()
        }
    });
});

module.exports = router;
