@echo off
echo [MATRIX] Upgrading AI Core (Ollama)...

:: 1. Update Ollama Binary
echo [1/2] Updating Ollama...
ollama --version

ollama pull llama3.2:latest
ollama pull deepseek-r1:latest
ollama pull nomic-embed-text:latest
ollama pull qwen2:latest
ollama pull phi3:latest
ollama pull mistral:latest
ollama pull codellama:latest
ollama pull gemma:latest
ollama pull wizardlm2:latest
ollama pull dolphin-mixtral:latest

:: 2. Verify Models
echo [2/2] Verifying Neural Models...
ollama list

echo [SUCCESS] AI Core Upgraded.
pause
