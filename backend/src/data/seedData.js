/**
 * Seed data with luxury auction items
 * Auctions end at staggered times from 2-15 minutes in the future
 * Using reliable Unsplash image URLs
 */

async function seedData(store) {
    const now = Date.now();

    const items = [
        {
            id: 'item_1',
            title: 'Rolex Submariner Date',
            description: '41mm, Black Dial, Oystersteel',
            imageUrl: 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=400&h=300&fit=crop',
            startingPrice: 8500,
            currentBid: 8500,
            currentBidder: null,
            endTime: now + (3 * 60 * 1000), // 3 minutes
            status: 'active'
        },
        {
            id: 'item_2',
            title: 'Vintage Leica Camera',
            description: 'Classic Film Camera, Pristine Condition',
            imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop',
            startingPrice: 2400,
            currentBid: 2400,
            currentBidder: null,
            endTime: now + (5 * 60 * 1000), // 5 minutes
            status: 'active'
        },
        {
            id: 'item_3',
            title: 'MacBook Pro 16"',
            description: '96GB RAM, 4TB SSD, Space Black',
            imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop',
            startingPrice: 3200,
            currentBid: 3200,
            currentBidder: null,
            endTime: now + (4 * 60 * 1000), // 4 minutes
            status: 'active'
        },
        {
            id: 'item_4',
            title: 'Abstract Oil Painting',
            description: '48x36" Canvas, Artist Signed 2024',
            imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
            startingPrice: 1800,
            currentBid: 1800,
            currentBidder: null,
            endTime: now + (7 * 60 * 1000), // 7 minutes
            status: 'active'
        },
        {
            id: 'item_5',
            title: 'Designer Leather Bag',
            description: 'Premium Leather, Brand New',
            imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=300&fit=crop',
            startingPrice: 1600,
            currentBid: 1600,
            currentBidder: null,
            endTime: now + (6 * 60 * 1000), // 6 minutes
            status: 'active'
        },
        {
            id: 'item_6',
            title: 'Professional DSLR Camera',
            description: 'Full-Frame, 8K Video Ready',
            imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop',
            startingPrice: 2800,
            currentBid: 2800,
            currentBidder: null,
            endTime: now + (8 * 60 * 1000), // 8 minutes
            status: 'active'
        },
        {
            id: 'item_7',
            title: 'Rare First Edition Book',
            description: 'Classic Literature, Signed Copy',
            imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop',
            startingPrice: 4500,
            currentBid: 4500,
            currentBidder: null,
            endTime: now + (10 * 60 * 1000), // 10 minutes
            status: 'active'
        },
        {
            id: 'item_8',
            title: 'Premium Headphones',
            description: 'Wireless Noise Cancelling',
            imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
            startingPrice: 280,
            currentBid: 280,
            currentBidder: null,
            endTime: now + (2 * 60 * 1000), // 2 minutes
            status: 'active'
        },
        {
            id: 'item_9',
            title: 'Luxury Swiss Watch',
            description: 'Steel Bracelet, Automatic Movement',
            imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop',
            startingPrice: 5200,
            currentBid: 5200,
            currentBidder: null,
            endTime: now + (9 * 60 * 1000), // 9 minutes
            status: 'active'
        },
        {
            id: 'item_10',
            title: 'Ergonomic Office Chair',
            description: 'Premium Mesh, Fully Adjustable',
            imageUrl: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400&h=300&fit=crop',
            startingPrice: 950,
            currentBid: 950,
            currentBidder: null,
            endTime: now + (12 * 60 * 1000), // 12 minutes
            status: 'active'
        },
        {
            id: 'item_11',
            title: 'VR Headset Pro',
            description: 'Latest Generation, Complete Kit',
            imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=400&h=300&fit=crop',
            startingPrice: 3200,
            currentBid: 3200,
            currentBidder: null,
            endTime: now + (11 * 60 * 1000), // 11 minutes
            status: 'active'
        },
        {
            id: 'item_12',
            title: 'Designer Sunglasses',
            description: 'Limited Edition, Polarized Lenses',
            imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop',
            startingPrice: 780,
            currentBid: 780,
            currentBidder: null,
            endTime: now + (15 * 60 * 1000), // 15 minutes
            status: 'active'
        }
    ];

    for (const item of items) {
        await store.createAuction(item);
    }

    console.log(`✅ Seeded ${items.length} auction items`);
}

module.exports = seedData;
