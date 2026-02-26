import { expect, test, describe } from 'vitest';
import { calculateUnlockedBadges, BADGES } from '@/lib/gamification';

describe('Gamification Engine', () => {
    test('should unlock First Light on first session', () => {
        const sessions = [{ id: 1 }];
        const unlockedIds = calculateUnlockedBadges(sessions);
        expect(unlockedIds).toContain('first-light');
    });

    test('should unlock Dedicated after 10 sessions', () => {
        const sessions = Array(10).fill({ id: 1 });
        const unlockedIds = calculateUnlockedBadges(sessions);
        expect(unlockedIds).toContain('dedicated');
    });

    test('should unlock Polymath with 3 different modes', () => {
        const sessions = [
            { mode: 'mindset' },
            { mode: 'career' },
            { mode: 'money' }
        ];
        const unlockedIds = calculateUnlockedBadges(sessions);
        expect(unlockedIds).toContain('polymath');
    });

    test('should unlock Deep Thinker (Writer) with 500 words', () => {
        const longInput = "word ".repeat(500);
        const sessions = [
            { initial_input: longInput }
        ];
        const unlockedIds = calculateUnlockedBadges(sessions);
        expect(unlockedIds).toContain('writer');
    });

    test('should return empty if conditions not met', () => {
        const sessions: any[] = [];
        const unlockedIds = calculateUnlockedBadges(sessions);
        expect(unlockedIds.length).toBe(0);
    });
});
