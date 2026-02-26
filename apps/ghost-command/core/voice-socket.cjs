const { WebSocketServer } = require('ws');
const { OpenAI } = require('openai');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

class VoiceSocketServer {
    constructor(port = 3006) {
        this.wss = new WebSocketServer({ port });
        this.clients = new Set();
        this.setup();
        console.log(`[VOICE_SOCKET] Listening on port ${port}`);
    }

    setup() {
        this.wss.on('connection', (ws) => {
            console.log('[VOICE_SOCKET] Client linked');
            this.clients.add(ws);

            let audioBuffer = [];

            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data.toString());

                    if (message.type === 'audio_chunk') {
                        // message.data is base64 string
                        const buffer = Buffer.from(message.data, 'base64');
                        audioBuffer.push(buffer);
                    } else if (message.type === 'audio_end') {
                        console.log('[VOICE_SOCKET] Processing audio segment...');
                        const fullBuffer = Buffer.concat(audioBuffer);
                        audioBuffer = [];

                        const transcription = await this.transcribe(fullBuffer);
                        if (transcription) {
                            console.log(`[VOICE_SOCKET] Transcription: ${transcription}`);
                            ws.send(JSON.stringify({ type: 'transcription', text: transcription }));

                            // Trigger LLM Response
                            await this.generateResponse(ws, transcription);
                        }
                    } else if (message.type === 'interrupt') {
                        console.log('[VOICE_SOCKET] User interrupted');
                        ws.send(JSON.stringify({ type: 'interrupted' }));
                    }
                } catch (e) {
                    // Raw binary data handling for efficiency
                    if (Buffer.isBuffer(data)) {
                        audioBuffer.push(data);
                    }
                }
            });

            ws.on('close', () => {
                this.clients.delete(ws);
                console.log('[VOICE_SOCKET] Client disconnected');
            });
        });
    }

    async generateResponse(ws, text) {
        try {
            const stream = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "You are Sage, the cognitive interface for the Matrix. Respond briefly and conversationally, as you are speaking to the user in a live voice session. Keep sentences punchy for TTS." },
                    { role: "user", content: text },
                ],
                stream: true,
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) {
                    ws.send(JSON.stringify({ type: 'llm_chunk', content }));
                }
            }

            ws.send(JSON.stringify({ type: 'llm_end' }));
        } catch (error) {
            console.error('[VOICE_SOCKET] LLM Error:', error.message);
            ws.send(JSON.stringify({ type: 'error', message: 'Neural link jitter in Sage pipeline.' }));
        }
    }

    async transcribe(buffer) {
        try {
            // Write buffer to temp file for Whisper API
            const tempPath = path.join(__dirname, `temp_voice_${Date.now()}.webm`);
            fs.writeFileSync(tempPath, buffer);

            const transcription = await groq.audio.transcriptions.create({
                file: fs.createReadStream(tempPath),
                model: "whisper-large-v3",
                response_format: "text",
            });

            fs.unlinkSync(tempPath);
            return transcription;
        } catch (error) {
            console.error('[VOICE_SOCKET] Transcription Error:', error.message);
            return null;
        }
    }
}

// Boot if called directly
if (require.main === module) {
    new VoiceSocketServer();
}

module.exports = VoiceSocketServer;
