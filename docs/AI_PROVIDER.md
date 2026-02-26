# AI Provider Setup (`docs/AI_PROVIDER.md`)

Reflect is designed to run with **any OpenAI-compatible API**. This primarily targets open-source models like Llama 3 or Mistral running on your own infrastructure (vLLM, Ollama) or via a privacy-focused provider.

## 1. Standard Configuration
Create a `.env.local` file in `/app`:

```bash
# The Base URL for the inference engine
# Examples: 
# - Ollama: http://localhost:11434/v1
# - vLLM: http://your-gpu-server:8000/v1
# - OpenAI (Fallback): https://api.openai.com/v1
AI_BASE_URL="http://localhost:11434/v1"

# API Key (Optional for local Ollama, required for others)
AI_API_KEY="sk-..."

# The Model ID to use
# Examples: "llama3", "mistral-7b", "gpt-4o-mini"
AI_MODEL_ID="llama3"
```

## 2. Recommended Open-Source Models
For the "Reflect" persona (calm, direct, analytical), we recommend:
*   **Llama 3 (8B or 70B)**: Excellent instruction following for the 3-part structure.
*   **Mistral Large**: Very precise, less "fluff".
*   **Phi-3**: Good for low-latency local execution on smaller devices.

## 3. Testing the Provider
We utilize a simple `curl` test script (conceptually) to verify the endpoint enforces the JSON schema or structure we need.

*Note: The application code will use the `openai` node SDK, configured with the custom `baseURL`, to ensure compatibility with the widest range of backends.*
