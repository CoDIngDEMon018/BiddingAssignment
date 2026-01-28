import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import ItemCard from './ItemCard';

// Memoized ItemGrid
const ItemGrid = memo(function ItemGrid({ items, currentUserId, timeOffset, token, onOptimisticBid }) {
    // Sort items: active first (by end time), then ended
    const sortedItems = [...items].sort((a, b) => {
        if (a.status !== b.status) {
            return a.status === 'active' ? -1 : 1;
        }
        return a.endTime - b.endTime;
    });

    const activeItems = sortedItems.filter(item => item.status === 'active');
    const endedItems = sortedItems.filter(item => item.status === 'ended');

    return (
        <div>
            {/* Section: Live Auctions */}
            {activeItems.length > 0 && (
                <section className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="live-dot"></span>
                        <h2 className="font-display text-2xl font-bold text-white">
                            Live Auctions
                        </h2>
                        <span className="px-3 py-1 bg-winning/10 text-winning text-sm font-semibold rounded-full">
                            {activeItems.length} active
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {activeItems.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{
                                    delay: index * 0.05,
                                    duration: 0.6,
                                    ease: [0.175, 0.885, 0.32, 1.275]
                                }}
                            >
                                <ItemCard
                                    item={item}
                                    currentUserId={currentUserId}
                                    timeOffset={timeOffset}
                                    token={token}
                                    onOptimisticBid={onOptimisticBid}
                                />
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* Section: Ended Auctions */}
            {endedItems.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <h2 className="font-display text-2xl font-bold text-gray-400">
                            Ended Auctions
                        </h2>
                        <span className="px-3 py-1 bg-gray-500/10 text-gray-500 text-sm font-semibold rounded-full">
                            {endedItems.length} ended
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-60">
                        {endedItems.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <ItemCard
                                    item={item}
                                    currentUserId={currentUserId}
                                    timeOffset={timeOffset}
                                    token={token}
                                    isEnded
                                />
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State */}
            {items.length === 0 && (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">🔨</div>
                    <h3 className="font-display text-2xl text-gray-400 mb-2">
                        No auctions yet
                    </h3>
                    <p className="text-gray-500">
                        Check back soon for exciting items!
                    </p>
                </div>
            )}
        </div>
    );
});

export default ItemGrid;
