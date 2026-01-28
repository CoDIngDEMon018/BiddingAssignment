/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Adrenaline Luxury Theme
                primary: {
                    50: '#0A0E27',
                    100: '#141B2E',
                    200: '#1A2238',
                    300: '#232B45',
                    400: '#2D3654',
                    500: '#3B4569',
                },
                gold: {
                    50: '#FFF9E6',
                    100: '#FFF3CC',
                    200: '#FFE699',
                    300: '#FFD666',
                    400: '#FFC933',
                    500: '#E6B52E',
                    600: '#CC9E1F',
                },
                winning: '#00FF94',
                outbid: '#FF3366',
                countdown: {
                    safe: '#E0E0E0',
                    warning: '#F7931E',
                    critical: '#FF6B35',
                }
            },
            fontFamily: {
                display: ['Playfair Display', 'serif'],
                body: ['DM Sans', 'sans-serif'],
                mono: ['Space Mono', 'monospace'],
            },
            animation: {
                'bid-flash': 'bidFlash 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                'price-update': 'priceUpdate 0.4s ease-out',
                'countdown-pulse': 'countdownPulse 1s ease-in-out infinite',
                'winning-glow': 'winningGlow 2s ease-in-out infinite',
                'outbid-shake': 'outbidShake 0.5s ease-out',
                'card-entry': 'cardEntry 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards',
                'live-pulse': 'livePulse 2s ease-in-out infinite',
                'shimmer': 'shimmer 2s infinite',
            },
            keyframes: {
                bidFlash: {
                    '0%': { transform: 'scale(1)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)' },
                    '15%': { transform: 'scale(1.03)', boxShadow: '0 0 30px rgba(255, 201, 51, 0.6), 0 8px 32px rgba(0, 0, 0, 0.4)' },
                    '30%': { transform: 'scale(0.98)' },
                    '45%': { transform: 'scale(1.01)' },
                    '100%': { transform: 'scale(1)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)' },
                },
                priceUpdate: {
                    '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
                    '50%': { transform: 'translateY(-10px) scale(1.1)', opacity: '0' },
                    '51%': { transform: 'translateY(10px) scale(0.9)', opacity: '0' },
                    '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
                },
                countdownPulse: {
                    '0%, 100%': { transform: 'scale(1)', color: '#FF6B35' },
                    '50%': { transform: 'scale(1.1)', color: '#FF8C5A' },
                },
                winningGlow: {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 255, 148, 0.4)', borderColor: 'rgba(0, 255, 148, 0.3)' },
                    '50%': { boxShadow: '0 0 20px 5px rgba(0, 255, 148, 0.4)', borderColor: 'rgba(0, 255, 148, 0.8)' },
                },
                outbidShake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
                    '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
                },
                cardEntry: {
                    'from': { opacity: '0', transform: 'translateY(30px) scale(0.95)' },
                    'to': { opacity: '1', transform: 'translateY(0) scale(1)' },
                },
                livePulse: {
                    '0%, 100%': { opacity: '1', transform: 'scale(1)' },
                    '50%': { opacity: '0.5', transform: 'scale(1.3)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
}
