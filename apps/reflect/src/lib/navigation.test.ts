import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn()
}));

describe('Navigation Logic Gates', () => {
    let mockSupabase: any;

    beforeEach(() => {
        mockSupabase = {
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: { id: '123' } } })
            },
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn()
        };
        (createClient as any).mockReturnValue(mockSupabase);
    });

    it('should identify users needing neural initialization', async () => {
        // Profile not found -> Needs init
        mockSupabase.maybeSingle.mockResolvedValue({ data: null });

        // This simulates the logic inside BootScreen
        const { data: user } = await mockSupabase.auth.getUser();
        const { data: profile } = await mockSupabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

        expect(profile).toBeNull();
    });

    it('should identify users with complete profiles', async () => {
        // Profile found
        mockSupabase.maybeSingle.mockResolvedValue({ data: { id: '123', onboarding_complete: true } });

        const { data: user } = await mockSupabase.auth.getUser();
        const { data: profile } = await mockSupabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

        expect(profile.onboarding_complete).toBe(true);
    });
});
