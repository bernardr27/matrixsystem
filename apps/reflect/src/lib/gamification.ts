import { ReflectMode } from "./ai/types";

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    condition: (sessions: any[]) => boolean;
}

export const BADGES: Badge[] = [
    {
        id: 'first-light',
        name: 'First Light',
        description: 'Completed your first reflection.',
        icon: '🕯️',
        condition: (s) => s.length >= 1
    },
    {
        id: 'dedicated',
        name: 'Dedicated',
        description: 'Completed 10 reflections.',
        icon: '🧱',
        condition: (s) => s.length >= 10
    },
    {
        id: 'polymath',
        name: 'Polymath',
        description: 'Reflected in at least 3 different modes.',
        icon: '🎨',
        condition: (s) => {
            const uniqueModes = new Set(s.map(i => i.mode));
            return uniqueModes.size >= 3;
        }
    },
    {
        id: 'writer',
        name: 'Deep Thinker',
        description: 'Wrote a cumulative 500 words.',
        icon: '✍️',
        condition: (s) => {
            const words = s.reduce((acc, curr) => acc + (curr.initial_input?.split(' ').length || 0), 0);
            return words >= 500;
        }
    }
];

export function calculateUnlockedBadges(sessions: any[]): string[] {
    return BADGES.filter(b => b.condition(sessions)).map(b => b.id);
}
