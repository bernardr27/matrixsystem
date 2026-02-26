import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                gold: {
                    50: '#fefce8',
                    100: '#fef9c3',
                    200: '#fef08a',
                    300: '#fde047',
                    400: '#f0c45c',
                    500: '#d4a843',
                    600: '#b8922f',
                    700: '#9a7b25',
                    800: '#7c631d',
                    900: '#5e4b16',
                    950: '#3f320f',
                },
            },
            fontFamily: {
                sans: ['var(--font-sans)'],
                display: ['var(--font-display)'],
                mono: ['var(--font-mono)', 'monospace'],
            },
            animation: {
                'breathe': 'breathe 3s ease-in-out infinite',
                'pulse-gold': 'pulseGold 2s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'slide-up': 'slideUp 0.4s ease-out forwards',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'spin-slow': 'spin 8s linear infinite',
            },
            keyframes: {
                breathe: {
                    '0%, 100%': { opacity: '0.4' },
                    '50%': { opacity: '1' },
                },
                pulseGold: {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 168, 67, 0.4)' },
                    '50%': { boxShadow: '0 0 0 10px rgba(212, 168, 67, 0)' },
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(212, 168, 67, 0.15)' },
                    '100%': { boxShadow: '0 0 25px rgba(212, 168, 67, 0.35)' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
