'use server';

import OpenAI from 'openai';

// Reuse the existing AI config
const BASE_URL = process.env.NEXT_PUBLIC_AI_BASE_URL!;
const API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY || 'ollama';

export async function transcribeAudio(formData: FormData) {
    const file = formData.get('audio') as File;
    if (!file) {
        return { success: false, error: 'No audio file provided' };
    }

    // NOTE: Local Ollama usually doesn't support /v1/audio/transcriptions yet (feature request).
    // This code assumes the provider SUPPORTS the OpenAI Audio API (e.g. real OpenAI or a compatible wrapper like 'whisper-cpp-server').
    // For safety, we wrap in try/catch.

    const client = new OpenAI({
        baseURL: BASE_URL,
        apiKey: API_KEY,
    });

    try {
        const transcription = await client.audio.transcriptions.create({
            file: file,
            model: "whisper-1", // Standard model name
        });

        return { success: true, text: transcription.text };
    } catch (error) {
        console.error("Transcription Error:", error);
        return { success: false, error: 'Transcription failed. Is Whisper configured?' };
    }
}
