import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                accent: "var(--accent)",
                "accent-glow": "var(--accent-glow)",
                "glass-bg": "var(--glass-bg)",
                "glass-border": "var(--glass-border)",
                "neural-pulse": "var(--neural-pulse)",
                anomaly: "var(--anomaly)",
                success: "var(--success)",
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
            }
        },
    },
    plugins: [],
};
export default config;
