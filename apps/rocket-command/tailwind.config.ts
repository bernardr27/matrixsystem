import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "var(--primary)",
                    foreground: "var(--primary-foreground)",
                },
                surface: {
                    DEFAULT: "var(--surface)",
                    glass: "var(--surface-glass)",
                    hover: "var(--surface-hover)",
                    active: "rgba(255, 255, 255, 0.1)",
                },
                accent: {
                    DEFAULT: "var(--accent)",
                    orange: "var(--accent-orange)",
                    cyan: "var(--accent-cyan)",
                    violet: "var(--accent-violet)",
                    glow: "var(--accent-glow)",
                },
                rocket: {
                    flame: "#ff6b35",
                    exhaust: "#ff9f1c",
                    hull: "#1a1a2e",
                    thrust: "#e84855",
                    boost: "#ffba08",
                },
                status: {
                    success: "#10b981",
                    warning: "#f59e0b",
                    error: "#ef4444",
                    info: "#3b82f6",
                },
            },
            fontFamily: {
                sans: ["var(--font-sans)", "system-ui", "sans-serif"],
                display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
                mono: ["Space Mono", "JetBrains Mono", "monospace"],
            },
            fontSize: {
                xs: ["0.75rem", { lineHeight: "1rem" }],
                sm: ["0.875rem", { lineHeight: "1.25rem" }],
                base: ["1rem", { lineHeight: "1.5rem" }],
                lg: ["1.125rem", { lineHeight: "1.75rem" }],
                xl: ["1.25rem", { lineHeight: "1.75rem" }],
                "2xl": ["1.5rem", { lineHeight: "2rem" }],
                "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
                "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "glass-gradient": "linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.0) 100%)",
            },
            animation: {
                "slide-up": "slideUpFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                "slide-down": "slideDownFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "flame-flicker": "flameFlicker 0.3s ease-in-out infinite alternate",
                "thrust-pulse": "thrustPulse 2s ease-in-out infinite",
                "orbit": "orbit 20s linear infinite",
                "launch": "launch 1s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            },
            keyframes: {
                flameFlicker: {
                    "0%": { opacity: "0.8", transform: "scaleY(1)" },
                    "100%": { opacity: "1", transform: "scaleY(1.1)" },
                },
                thrustPulse: {
                    "0%, 100%": { boxShadow: "0 0 20px rgba(255, 107, 53, 0.3)" },
                    "50%": { boxShadow: "0 0 40px rgba(255, 107, 53, 0.6)" },
                },
                orbit: {
                    "0%": { transform: "rotate(0deg) translateX(100px) rotate(0deg)" },
                    "100%": { transform: "rotate(360deg) translateX(100px) rotate(-360deg)" },
                },
                launch: {
                    "0%": { transform: "translateY(20px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                slideUpFadeIn: {
                    "0%": { transform: "translateY(10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                slideDownFadeIn: {
                    "0%": { transform: "translateY(-10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
            },
        },
    },
};

export default config;
