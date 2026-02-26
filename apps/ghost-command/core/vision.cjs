const { OpenAI } = require('openai');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

class GhostVision {
    constructor() {
        this.model = process.env.GROQ_API_KEY ? 'llama-3.2-11b-vision-preview' : 'moondream:latest';
        console.log(`[GHOST_VISION] Initialized with model: ${this.model}`);
    }

    async analyzeImage(imagePath, prompt = "Describe this image in detail for a neural cognitive system.") {
        try {
            if (!fs.existsSync(imagePath)) {
                throw new Error(`Image not found at path: ${imagePath}`);
            }

            const base64Image = fs.readFileSync(imagePath).toString('base64');
            const dataUrl = `data:image/jpeg;base64,${base64Image}`;

            const response = await groq.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            { type: "image_url", image_url: { url: dataUrl } }
                        ],
                    },
                ],
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('[GHOST_VISION] Analysis Error:', error.message);
            return null;
        }
    }

    async auditUI(screenshotPath) {
        const prompt = "Act as a Senior UI/UX Engineer and Neural Auditor. Analyze this screenshot of the Matrix system. Identify overlapping elements, contrast issues, and alignment bugs. Respond with a technical report.";
        return this.analyzeImage(screenshotPath, prompt);
    }
}

// Single instance for external use
const vision = new GhostVision();

// Boot if called directly
if (require.main === module) {
    // Example test if a path is provided
    const testPath = process.argv[2];
    if (testPath) {
        vision.analyzeImage(testPath).then(res => console.log(res));
    } else {
        console.log("Usage: node vision.cjs <image_path>");
    }
}

module.exports = vision;
