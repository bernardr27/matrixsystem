import { reflectEngine } from './engine';

export async function generateNeuralInsights(
    name: string,
    archetype: any,
    tier: string,
    calibrationSnippet: string
): Promise<string> {
    const prompt = `
Generate a high-fidelity "Neural Insights" summary for a new user entering the Cortex.
User Signature: ${name}
Archetype: ${archetype?.name} (${archetype?.id})
Fidelity Tier: ${tier}
Calibration Input: "${calibrationSnippet}"

The summary should be formatted as a "Neural Horoscope" / Systemic Synthesis.
Structure:
1. **Resonance Profile**: A one-sentence poetic summary of their current alignment.
2. **Synchronized Potential**: How their archetype will evolve within the Cortex.
3. **Daily Directive**: A short, cryptic piece of advice based on their calibration.

Tone: Mystical, technical, premium, and deeply personalized.
Length: Approx 100-150 words.
Do not use generic placeholders. Use the user's specific inputs to tailor the response.
`;

    try {
        const completion = await reflectEngine.getCompletion([
            { role: 'system', content: "You are the Cortex Insights Engine. You synthesize user resonance into high-fidelity prognostications." },
            { role: 'user', content: prompt }
        ], process.env.AI_MODEL || 'llama3');

        return completion.content.trim();
    } catch (error) {
        console.error("Failed to generate insights:", error);
        return "Your resonance is stabilizing. Explore the Cortex to deepen your signal.";
    }
}
