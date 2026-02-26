/**
 * GEMINI BRIDGE v1.0
 * ══════════════════
 * Programmatic interface for invoking Google Gemini CLI
 * from within the Matrix agent infrastructure.
 * 
 * Usage:
 *   const gemini = require('./gemini-bridge.cjs');
 *   const result = await gemini.prompt('Explain this codebase');
 *   const json = await gemini.promptJSON('List all API routes');
 */

const { execFile } = require('child_process');
const path = require('path');

const MATRIX_ROOT = path.resolve(__dirname, '..', '..', '..');
const DEFAULT_TIMEOUT = 120000; // 2 minutes

/**
 * Run a Gemini CLI prompt in headless mode and return the text response.
 * @param {string} prompt - The prompt to send
 * @param {object} [options] - Configuration options
 * @param {string} [options.model] - Model to use (default: gemini-2.5-flash)
 * @param {number} [options.timeout] - Timeout in ms (default: 120000)
 * @param {string} [options.cwd] - Working directory (default: matrix root)
 * @returns {Promise<string>} The model's text response
 */
async function prompt(promptText, options = {}) {
    const {
        model = 'gemini-2.5-flash',
        timeout = DEFAULT_TIMEOUT,
        cwd = MATRIX_ROOT,
    } = options;

    const args = [
        '-p', promptText,
        '-m', model,
        '--sandbox', 'none',
    ];

    return new Promise((resolve, reject) => {
        const child = execFile('gemini', args, {
            cwd,
            timeout,
            maxBuffer: 10 * 1024 * 1024, // 10MB
            env: { ...process.env },
            windowsHide: true,
        }, (error, stdout, stderr) => {
            if (error) {
                if (error.killed) {
                    reject(new Error(`[GEMINI_BRIDGE] Timeout after ${timeout}ms`));
                } else {
                    reject(new Error(`[GEMINI_BRIDGE] ${error.message}\n${stderr}`));
                }
                return;
            }
            resolve(stdout.trim());
        });
    });
}

/**
 * Run a Gemini CLI prompt and parse the response as JSON.
 * @param {string} promptText - The prompt to send
 * @param {object} [options] - Configuration options
 * @returns {Promise<object>} Parsed JSON response
 */
async function promptJSON(promptText, options = {}) {
    const args = [
        '-p', promptText,
        '-m', options.model || 'gemini-2.5-flash',
        '--output-format', 'json',
        '--sandbox', 'none',
    ];

    return new Promise((resolve, reject) => {
        execFile('gemini', args, {
            cwd: options.cwd || MATRIX_ROOT,
            timeout: options.timeout || DEFAULT_TIMEOUT,
            maxBuffer: 10 * 1024 * 1024,
            env: { ...process.env },
            windowsHide: true,
        }, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`[GEMINI_BRIDGE] ${error.message}`));
                return;
            }
            try {
                const parsed = JSON.parse(stdout.trim());
                resolve(parsed);
            } catch (parseErr) {
                // If JSON parsing fails, return as raw text wrapped in an object
                resolve({ raw: stdout.trim(), parseError: parseErr.message });
            }
        });
    });
}

/**
 * Run a Gemini CLI prompt against a specific app directory.
 * @param {string} appName - App name (citadel, reflect, nexus, rocket-command, ghost-command)
 * @param {string} promptText - The prompt to send
 * @param {object} [options] - Configuration options
 * @returns {Promise<string>} The model's text response
 */
async function promptApp(appName, promptText, options = {}) {
    const appDir = path.join(MATRIX_ROOT, 'apps', appName);
    return prompt(promptText, { ...options, cwd: appDir });
}

/**
 * Analyze a file using Gemini CLI.
 * @param {string} filePath - Absolute path to file
 * @param {string} question - Question about the file
 * @returns {Promise<string>} Analysis result
 */
async function analyzeFile(filePath, question = 'Explain this file') {
    const dir = path.dirname(filePath);
    const fileName = path.basename(filePath);
    return prompt(`Read the file "${fileName}" and ${question}`, { cwd: dir });
}

/**
 * Generate code using Gemini CLI.
 * @param {string} description - What to generate
 * @param {object} [options] - Configuration options
 * @returns {Promise<string>} Generated code
 */
async function generateCode(description, options = {}) {
    return prompt(
        `Generate the following code. Output ONLY the code, no explanations:\n\n${description}`,
        { ...options, model: options.model || 'gemini-2.5-pro' }
    );
}

module.exports = {
    prompt,
    promptJSON,
    promptApp,
    analyzeFile,
    generateCode,
    MATRIX_ROOT,
};
