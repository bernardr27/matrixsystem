'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

export default function Bootloader() {
    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();
    const pathname = usePathname();
    const checkRef = useRef<boolean>(false);

    useEffect(() => {
        const checkOnboarding = async (session: Session | null) => {
            if (!session || checkRef.current) return;
            checkRef.current = true;

            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('onboarding_complete')
                    .eq('id', session.user.id)
                    .maybeSingle();

                // Allow redirect from '/' (landing) or other pages if authenticated but not onboarded
                // CRITICAL: Do NOT redirect if already on /neural-initialize OR /session (dashboard)
                // This prevents infinite loops if the DB update is slow or if user forces entry.
                if (
                    profile &&
                    !profile.onboarding_complete &&
                    pathname !== '/neural-initialize' &&
                    pathname !== '/session'
                ) {
                    // Safeguard: Track redirect attempts to prevent infinite loops
                    const redirectAttempts = parseInt(sessionStorage.getItem('onboarding_redirects') || '0');
                    if (redirectAttempts < 3) {
                        sessionStorage.setItem('onboarding_redirects', String(redirectAttempts + 1));
                        router.replace('/neural-initialize'); // Use replace to avoid history buildup
                    } else {
                        console.warn('[Bootloader] Max redirect attempts reached. User may manually navigate.');
                    }
                } else if (profile?.onboarding_complete) {
                    // Clear redirect counter on successful onboarding
                    sessionStorage.removeItem('onboarding_redirects');
                }
            } catch (err) {
                // Fail silently to avoid crash loops
            } finally {
                setTimeout(() => { checkRef.current = false; }, 5000); // Debounce checks
            }
        };

        // Listen for auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                    if (pathname !== '/login') {
                        // Use requestIdleCallback to avoid blocking hydration
                        if (typeof window !== 'undefined' && (window as any).requestIdleCallback) {
                            (window as any).requestIdleCallback(() => checkOnboarding(session));
                        } else {
                            setTimeout(() => checkOnboarding(session), 1000);
                        }
                    }
                }
            }
        );

        return () => {
            if (authListener && authListener.subscription) {
                authListener.subscription.unsubscribe();
            }
        };
    }, [pathname, router, supabase]);

    return null;
}
