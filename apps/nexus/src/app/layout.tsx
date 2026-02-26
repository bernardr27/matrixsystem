import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { Viewport } from "next";
import "./globals.css";
import { TelemetryProvider } from "@/components/providers/TelemetryProvider";
import { SoulProvider } from "@/components/providers/SoulProvider";
import GlobalErrorBoundary from "@/components/debug/GlobalErrorBoundary";
import { NeuralPulseOverlay } from "@/components/ui/NeuralPulseOverlay";
import { NexusShell } from "@/components/ui/NexusShell";
import { ServiceWorkerRegister } from "@/components/providers/ServiceWorkerRegister";
import TelemetryOfflineBanner from "@/components/ui/TelemetryOfflineBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Matrix Hub | Command Center Pro",
  description: "Advanced management and monitoring platform for Reflect OS.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Matrix Hub",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0B0E14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ backgroundColor: '#0B0E14' }}>
      <body className={`${inter.className} bg-[#0B0E14] min-h-screen text-slate-200`} style={{ backgroundColor: '#0B0E14' }}>
        <GlobalErrorBoundary>
          <SoulProvider>
            <TelemetryProvider>
              <ServiceWorkerRegister />
              <NexusShell>
                <NeuralPulseOverlay />
                <TelemetryOfflineBanner />
                {children}
              </NexusShell>
            </TelemetryProvider>
          </SoulProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
