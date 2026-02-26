import { isSafeMode } from '@/lib/safe-mode';
import { createBrowserSupabaseClientFromEnv } from '@matrix-lib/supabase/next';

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

    // RESTORED: Mock Client for Safe Mode / Simulation
    // Only activates if user explicitly toggles Safe Mode or Env var is set
    if (isSafeMode()) {
        
        return {
            auth: {
                getSession: async () => ({
                    data: {
                        session: {
                            user: {
                                id: 'test-user-123',
                                email: 'test@reflect.sovereign',
                                user_metadata: { username: 'TestUser' }
                            }
                        }
                    },
                    error: null
                }),
                getUser: async () => ({
                    data: {
                        user: {
                            id: 'test-user-123',
                            email: 'test@reflect.sovereign',
                            user_metadata: { username: 'TestUser' }
                        }
                    },
                    error: null
                }),
                signInWithPassword: async () => ({
                    data: {
                        user: {
                            id: 'test-user-123',
                            email: 'test@reflect.sovereign',
                            user_metadata: { username: 'TestUser' }
                        }
                    },
                    error: null
                }),
                signUp: async () => ({
                    data: {
                        user: {
                            id: 'test-user-123',
                            email: 'test@reflect.sovereign',
                            user_metadata: { username: 'TestUser' }
                        }
                    },
                    error: null
                }),
                signOut: async () => ({ error: null }),
                onAuthStateChange: (callback: any) => {
                    // Mimic initial session callback behavior in dev
                    try {
                        callback('INITIAL_SESSION', {
                            user: {
                                id: 'test-user-123',
                                email: 'test@reflect.sovereign',
                                user_metadata: { username: 'TestUser' }
                            }
                        });
                    } catch { }
                    return { data: { subscription: { unsubscribe: () => { } } } };
                }
            },
            from: (table: string) => ({
                select: () => ({
                    eq: () => ({
                        maybeSingle: async () => ({
                            data: table === 'profiles' ? {
                                id: 'test-user-123',
                                username: 'TestUser',
                                onboarding_complete: true
                            } : null,
                            error: null
                        })
                    })
                }),
                upsert: async () => ({ error: null }),
                insert: async () => ({ error: null })
            })
        } as any;
    }

    if (!url || !key) {
        console.warn("[Supabase] Missing credentials - returning basic mock.");
        return {
            auth: {
                getUser: async () => ({ data: { user: null }, error: null }),
                getSession: async () => ({ data: { session: null }, error: null }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } })
            },
            from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) })
        } as any;
    }

    return createBrowserSupabaseClientFromEnv(process.env);
}
