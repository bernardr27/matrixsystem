import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { DebugProvider } from '@/lib/debug/context';
import DebugOverlay from '@/components/DebugOverlay';
import Header from '@/components/Header/Header';
import { CommandPalette } from '@/components/CommandPalette/CommandPalette';

import { BottomNav } from '@/components/layout/BottomNav';
import { SessionGuard } from '@/components/SessionGuard';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { AccountProvider } from '@/context/AccountContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { CognitiveProvider } from '@/context/CognitiveContext';
import ToastContainer from '@/components/ui/ToastContainer';
import { GlobalNeuralErrorBoundary as GlobalErrorBoundary } from '@/components/debug/GlobalNeuralErrorBoundary';
import { DiagnosticProvider } from '@/components/providers/DiagnosticProvider';
import { UIProvider } from '@/context/UIContext';
import { ServiceWorkerRegister } from '@/components/providers/ServiceWorkerRegister';
import SafeModeBanner from '@/components/ui/SafeModeBanner';

export const metadata: Metadata = {
  title: 'Reflect',
  description: 'A premium minimalist self-reflection app.',
  manifest: '/manifest.json',
  icons: {
    icon: '/reflect_logo_v3.png',
    apple: '/reflect_logo_v3.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Reflect',
  },
};

export const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0B0E14',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ backgroundColor: '#0B0E14' }}>
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className={`${inter.variable} ${outfit.variable} bg-[#0B0E14] min-h-screen text-slate-200`} style={{ backgroundColor: '#0B0E14' }}>
        <GlobalErrorBoundary>
          <ServiceWorkerRegister />
          <AccountProvider>
            <CognitiveProvider>
              <NotificationProvider>
                <ThemeProvider>
                  <DiagnosticProvider app="reflect">
                    <UIProvider>
                      <SessionGuard />
                      <CommandPalette />
                      <DebugProvider>
                        <SafeModeBanner />
                        <Header />
                        {children}
                        <BottomNav />
                      </DebugProvider>
                      <ToastContainer />
                    </UIProvider>
                  </DiagnosticProvider>
                </ThemeProvider>
              </NotificationProvider>
            </CognitiveProvider>
          </AccountProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
