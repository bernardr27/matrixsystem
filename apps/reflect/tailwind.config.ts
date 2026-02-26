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
                    glow: "var(--accent-glow)",
                },
                status: {
                    success: "#10b981",
                    warning: "#f59e0b",
                    error: "#ef4444",
                    info: "#3b82f6"
                }
            },
            fontFamily: {
                sans: ["var(--font-sans)", "system-ui", "sans-serif"],
                display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
                mono: ["Space Mono", "monospace"],
            },
            fontSize: {
                // Fluid Typography Scale (Mobile -> Desktop)
                "xs": "clamp(0.75rem, 1vw + 0.5rem, 0.875rem)",
                "sm": "clamp(0.875rem, 1vw + 0.6rem, 1rem)",
                "base": "clamp(1rem, 1.2vw + 0.8rem, 1.125rem)",
                "lg": "clamp(1.125rem, 1.5vw + 0.8rem, 1.25rem)",
                "xl": "clamp(1.25rem, 2vw + 0.8rem, 1.5rem)",
                "2xl": "clamp(1.5rem, 2.5vw + 1rem, 2rem)",
                "3xl": "clamp(2rem, 3.5vw + 1.2rem, 3rem)",
                "4xl": "clamp(2.5rem, 5vw + 1.5rem, 4rem)",
            },
            spacing: {
                "dock": "var(--dock-height)",
                "header": "var(--header-height)",
                "safe-top": "var(--safe-area-top)",
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
            },
        },
    },
    plugins: [],
};
export default config;
