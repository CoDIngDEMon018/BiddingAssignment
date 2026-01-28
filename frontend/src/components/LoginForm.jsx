import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';

function LoginForm({ onLogin }) {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username.trim() || username.trim().length < 2) {
            setError('Username must be at least 2 characters');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', {
                username: username.trim()
            });

            if (response.data.success) {
                const { token, user } = response.data.data;
                onLogin(user, token);
            }
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
                className="w-full max-w-md"
            >
                <div className="glass-card p-8 shadow-2xl">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600"
                        >
                            <span className="text-4xl">⚡</span>
                        </motion.div>
                        <h1 className="font-display text-4xl font-bold gradient-text mb-2">
                            Live Auction
                        </h1>
                        <p className="text-gray-400 font-body">
                            Enter the arena. Bid in real-time.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                                Your Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter any username..."
                                className="w-full px-4 py-4 bg-primary-100 border border-primary-300 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all font-body text-lg"
                                autoFocus
                            />
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-gold text-lg font-bold py-4 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Entering...
                                </>
                            ) : (
                                <>
                                    Enter Auction
                                    <span className="text-xl">→</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-gray-500 text-sm mt-6">
                        No password required. Just pick a username and start bidding!
                    </p>
                </div>

                {/* Features */}
                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-4"
                    >
                        <div className="text-2xl mb-2">⚡</div>
                        <p className="text-xs text-gray-400 font-medium">Real-Time Bids</p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="p-4"
                    >
                        <div className="text-2xl mb-2">🔒</div>
                        <p className="text-xs text-gray-400 font-medium">Race-Safe</p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="p-4"
                    >
                        <div className="text-2xl mb-2">⏱️</div>
                        <p className="text-xs text-gray-400 font-medium">Synced Timers</p>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}

export default LoginForm;
