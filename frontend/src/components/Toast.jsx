import { motion } from 'framer-motion';

function Toast({ message, type = 'info', onClose }) {
    const bgColors = {
        success: 'bg-winning/20 border-winning/30 text-winning',
        error: 'bg-outbid/20 border-outbid/30 text-outbid',
        warning: 'bg-countdown-warning/20 border-countdown-warning/30 text-countdown-warning',
        info: 'bg-gold-400/20 border-gold-400/30 text-gold-400'
    };

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    return (
        <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border backdrop-blur-lg shadow-2xl ${bgColors[type]}`}
        >
            <span className="text-xl">{icons[type]}</span>
            <p className="font-medium text-sm">{message}</p>
            <button
                onClick={onClose}
                className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
            >
                ✕
            </button>
        </motion.div>
    );
}

export default Toast;
