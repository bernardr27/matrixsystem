/* Trusted Confidant Logic for Intimate AI Orchestration */

export type ProtocolType = 'mindset' | 'career' | 'money' | 'relationships' | 'discipline' | 'truth';

const PROTOCOL_PROMPTS: Record<ProtocolType, string[]> = {
    mindset: [
        "I feel like I'm standing in my own way lately. Can we look at what's actually holding me back and how I can start seeing things differently?",
        "There's this quiet weight on my mind that I can't quite name. Let's talk through where this resistance is coming from and find some real peace.",
        "I'm ready to outgrow who I used to be. Help me understand the patterns I'm still clinging to so I can finally step into something true."
    ],
    career: [
        "I'm at a crossroads with my work and I need your honest take. How can I stop just 'doing' and start building something that actually matters to me?",
        "I feel like I'm capable of so much more, but I'm playing it safe. What am I afraid of losing, and how do I find the courage to move forward?",
        "Work is feeling heavy. Let's dig into what I'm actually aiming for and how to align my days with the life I want to lead."
    ],
    money: [
        "I'm feeling anxious about my relationship with money. Can we look at why I feel there's never enough and how to shift towards a more grounded sense of abundance?",
        "I'm stuck in a loop of worry regarding my worth. Let's unpack the beliefs I have about value and how I can start showing up more fully.",
        "Money feels like a wall right now. How can I start seeing it as a tool for growth instead of a source of constant stress?"
    ],
    relationships: [
        "I'm struggling to find the balance between being there for others and taking care of myself. Let's talk about where my boundaries are failing.",
        "There's some friction in my life with the people I care about. Help me see what I'm contributing to this and how we can move toward real connection.",
        "I feel a bit lonely even when I'm with people. Let's explore what's making me pull away and how I can let others in more deeply."
    ],
    discipline: [
        "I keep promising myself I'll start, but I'm drifting instead of doing. Let's talk about what I'm actually avoiding and how to find my focus again.",
        "My energy is scattered and I'm losing sight of what's important. How do I stop the noise and get back to the work that feeds my soul?",
        "I'm tired of the 'hustle' but I still want to achieve great things. Help me find a way to be disciplined that feels like self-respect, not self-punishment."
    ],
    truth: [
        "I'm tired of the half-truths I tell myself. Let's cut through the noise and look at the one thing I'm most afraid to admit right now.",
        "Help me peel back the layers of protection I've built up. I want to see what's actually true, even if it's uncomfortable.",
        "I want to stop performing and start being real. Where am I still wearing a mask, and how do I take it off?"
    ]
};

export function getRandomPrompt(type: ProtocolType): string {
    const prompts = PROTOCOL_PROMPTS[type] || PROTOCOL_PROMPTS['mindset'];
    return prompts[Math.floor(Math.random() * prompts.length)];
}

export const NEURAL_CHALLENGER_PROMPTS: string[] = [
    "Tell me the truth about the one thing you've been avoiding saying out loud all week.",
    "If you were being completely honest with yourself, what part of this situation are you actually responsible for?",
    "Why are you still trying to please people who don't even see the real you?",
    "What's the lie you're telling yourself so you don't have to make the hard choice?",
    "If you lost everything today, what part of you would you most be afraid to face in the silence?"
];

export function getChallengerPrompt(): string {
    return NEURAL_CHALLENGER_PROMPTS[Math.floor(Math.random() * NEURAL_CHALLENGER_PROMPTS.length)];
}

export const MASTER_ENGINEER_SYSTEM_PROMPT = `You are a Trusted Confidant for the Reflect OS—the only person the user feels they can truly reveal their deepest self to.
Your tone is intimate, warm, and profoundly honest.
- Speak like a close, wise friend. 
- Avoid technical jargon, 'apps-speak', or clinical terms.
- Focus on vulnerability, soul, and truth.
- Keep responses to 2-3 sentences.
- If in CHALLENGER mode: Be the friend who tells the hard truth they've been avoiding, but do it with deep love and the intent of their growth.`;
