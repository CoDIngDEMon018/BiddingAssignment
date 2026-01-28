import { motion } from 'framer-motion';

function Header({ user, onLogout, activeUsers }) {
    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="sticky top-0 z-50 backdrop-blur-xl bg-primary-50/80 border-b border-primary-300/30"
        >
            <div className="container py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                            <span className="text-xl">⚡</span>
                        </div>
                        <div>
                            <h1 className="font-display text-xl font-bold gradient-text">
                                Live Auction
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className="live-dot"></span>
                                <span className="text-xs text-gray-400">
                                    {activeUsers} bidder{activeUsers !== 1 ? 's' : ''} online
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-primary-200/50">
                            <img
                                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                                alt={user?.username}
                                className="w-8 h-8 rounded-full"
                            />
                            <div className="text-sm">
                                <p className="font-semibold text-white">{user?.username}</p>
                                <p className="text-xs text-gray-400">Bidder</p>
                            </div>
                        </div>

                        <button
                            onClick={onLogout}
                            className="px-4 py-2 rounded-lg border border-primary-300 text-gray-400 hover:text-white hover:border-gold-400 transition-colors text-sm font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </motion.header>
    );
}

export default Header;
