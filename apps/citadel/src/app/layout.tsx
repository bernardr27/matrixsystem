import type { Metadata, Viewport } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
});

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-display",
    display: "swap",
});

const jetbrains = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    display: "swap",
});

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
    themeColor: '#0B0E14',
};

export const metadata: Metadata = {
    title: 'CITADEL v3.0 — Matrix Command Center',
    description: "Secure launcher & management interface for the Matrix ecosystem",
    icons: { icon: "/favicon.ico" },
    other: {
        'cache-control': 'no-cache, no-store, must-revalidate',
        'pragma': 'no-cache',
        'expires': '0'
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Citadel',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <body
                className={`${inter.variable} ${outfit.variable} ${jetbrains.variable} font-sans antialiased`}
                suppressHydrationWarning
            >
                {children}
            </body>
        </html>
    );
}
