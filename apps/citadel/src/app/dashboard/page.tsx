'use client';

import React from 'react';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { MatrixDesktop } from '@/components/dashboard/MatrixDesktop';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/* ═══════════════════════════════════════════════════════
   CITADEL DASHBOARD — Authenticated app management
   Protected by middleware + AuthProvider session check
   ═══════════════════════════════════════════════════════ */

export default function DashboardPage() {


    return (
        <ErrorBoundary>
            <AuthProvider>
                <MatrixDesktop />
            </AuthProvider>
        </ErrorBoundary>
    );
}
