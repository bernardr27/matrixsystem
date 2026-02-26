import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DiagnosticProvider } from "@/components/providers/DiagnosticProvider";
import { SageProvider } from "@/context/SageContext";

export const metadata: Metadata = {
  title: "GHOST COMMAND",
  description: "Tactile Neural Remote",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GhostCmd",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0E14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

import { UIDebugger } from "@/components/debug/UIDebugger";
import { NeuralWeaving } from "@/components/ui/NeuralWeaving";
import SupabaseStatusBanner from "@/components/ui/SupabaseStatusBanner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning style={{ backgroundColor: '#0B0E14' }}>
      <body className="bg-[#0B0E14] min-h-screen text-slate-200" style={{ backgroundColor: '#0B0E14' }}>
        <DiagnosticProvider app="ghost">
          <SageProvider>
            <div id="matrix-root" className="h-screen w-full overflow-hidden relative">
              <NeuralWeaving />
              <SupabaseStatusBanner />
              {children}
            </div>
            {/* UIDebugger moved to IndustrialConsole for sidebar integration */}
          </SageProvider>
        </DiagnosticProvider>
      </body>
    </html>
  );
}
