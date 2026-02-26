import { ReflectMode } from '@/lib/ai/types';

export interface PathDay {
    day: number;
    title: string;
    prompt: string;
    mode: ReflectMode;
}

export interface Path {
    id: string; // slug
    title: string;
    description: string;
    duration: string; // "7 Days"
    color: string;
    days: PathDay[];
}

export const PATHS: Path[] = [
    {
        id: "stoic-week",
        title: "Stoic Foundation",
        description: "Build emotional resilience using ancient wisdom. 7 days to unshakable calm.",
        duration: "7 Days",
        color: "#6366f1", // Mindset Blue
        days: [
            { day: 1, title: "The Dichotomy of Control", prompt: "What is one thing worrying you right now that is completely outside your control?", mode: "mindset" },
            { day: 2, title: "Negative Visualization", prompt: "Imagine you lost your job today. How would you survive? What do you still have?", mode: "career" },
            { day: 3, title: "Voluntary Discomfort", prompt: "What is a small comfort you can give up today to toughen your mind?", mode: "discipline" },
        ]
    },
    {
        id: "career-clarity",
        title: "Career Clarity",
        description: "Stop drifting. Define your next move and remove the blockers.",
        duration: "3 Days",
        color: "#10b981", // Career Green
        days: [
            { day: 1, title: "The Zone of Genius", prompt: "When was the last time you worked and felt completely energized? What were you doing?", mode: "career" },
            { day: 2, title: "The Anti-Goal", prompt: "What does a miserable day look like to you? Be specific.", mode: "career" },
            { day: 3, title: "The Next Step", prompt: "What is the single smallest action you can take to move towards your ideal role?", mode: "career" },
        ]
    }
];
