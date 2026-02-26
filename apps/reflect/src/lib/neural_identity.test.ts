import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/session/start/route';
import { getDb } from '@/lib/sqlite';
import { createClient } from '@/lib/supabase/server';

// Mock sqlite and AI engine
vi.mock('@/lib/sqlite', () => ({
    getDb: vi.fn()
}));

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn()
}));

vi.mock('@/lib/ai/engine', () => {
    const mock = {
        generateReflection: vi.fn().mockResolvedValue({
            mirror: "I hear you.",
            pattern: "A pattern.",
            reframe: "A question?"
        }),
        getCompletion: vi.fn().mockResolvedValue({ content: '[]' })
    };
    return {
        reflectEngine: mock,
        getEngine: vi.fn().mockReturnValue(mock)
    };
});

describe('Neural Identity Integration', () => {
    let mockDb: any;
    let mockQuery: any;
    let mockSupabase: any;

    beforeEach(() => {
        mockQuery = {
            get: vi.fn().mockReturnValue({
                username: 'TestUser',
                reflection_points: 40,
                preferred_tone: 'Neutral',
                ai_provider: 'openai',
                local_ai_url: 'http://localhost:11434/v1',
                local_ai_model: 'llama3.2'
            }),
            run: vi.fn().mockReturnValue({ lastInsertRowid: 1 }),
            all: vi.fn().mockReturnValue([])
        };
        mockDb = {
            prepare: vi.fn().mockReturnValue(mockQuery)
        };
        (getDb as any).mockReturnValue(mockDb);

        const chain: any = {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            select: vi.fn(() => chain),
            update: vi.fn(() => chain),
            eq: vi.fn(() => chain),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            order: vi.fn(() => chain),
            limit: vi.fn(() => chain),
            neq: vi.fn(() => chain)
        };

        mockSupabase = {
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: null } })
            },
            from: vi.fn(() => chain)
        };
        (createClient as any).mockResolvedValue(mockSupabase);
    });

    it('should award points and progress tiers correctly', async () => {
        const req = new Request('http://localhost:3000/api/session/start', {
            method: 'POST',
            body: JSON.stringify({ text: 'Test thought', mode: 'mindset' })
        });

        const res = await POST(req);
        expect(res.status).toBe(200);

        // Verify points update call
        expect(mockDb.prepare).toHaveBeenCalledWith('UPDATE profiles SET reflection_points = ?, tier = ? WHERE 1=1');
        expect(mockQuery.run).toHaveBeenCalledWith(50, 'Sprout');
    });

    it('should reach Singularity at 200 points', async () => {
        // Mock profile: 190 points
        mockQuery.get.mockReturnValue({
            username: 'TestUser',
            reflection_points: 190,
            preferred_tone: 'Neutral',
            ai_provider: 'openai',
            local_ai_url: 'http://localhost:11434/v1',
            local_ai_model: 'llama3.2'
        });

        const req = new Request('http://localhost:3000/api/session/start', {
            method: 'POST',
            body: JSON.stringify({ text: 'Final thought', mode: 'mindset' })
        });

        await POST(req);
        expect(mockQuery.run).toHaveBeenCalledWith(200, 'Singularity');
    });
});
