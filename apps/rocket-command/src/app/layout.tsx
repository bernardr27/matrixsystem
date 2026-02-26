import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { RocketProvider } from "@/components/providers/RocketProvider";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { RocketShell } from "@/components/layout/RocketShell";

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

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
    themeColor: '#0B0E14',
};

export const metadata: Metadata = {
    title: "RocketCommand Pro",
    description: "Antigravity-powered command center — AI chat, mission control, and live telemetry",
    icons: { icon: "/favicon.ico" },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'RocketCommand',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark" style={{ backgroundColor: '#0B0E14' }}>
            <body className={`${inter.variable} ${outfit.variable} font-sans antialiased text-slate-200 bg-[#0B0E14]`} style={{ backgroundColor: '#0B0E14' }} suppressHydrationWarning>
                <RocketProvider>
                    <SettingsProvider>
                        <ToastProvider>
                            <RocketShell>
                                {children}
                            </RocketShell>
                        </ToastProvider>
                    </SettingsProvider>
                </RocketProvider>
            </body>
        </html>
    );
}
