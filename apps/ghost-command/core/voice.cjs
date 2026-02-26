const { exec } = require('child_process');

const Voice = {
    speak: (text) => {
        return new Promise((resolve, reject) => {
            if (!text) return resolve();

            // Sanitize text for PowerShell
            const safeText = text.replace(/"/g, '`"').replace(/'/g, "''");

            const psCommand = `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 1  # Slightly faster than default
$synth.Speak('${safeText}')
`;
            exec(`powershell -NoProfile -Command "${psCommand}"`, (err, stdout, stderr) => {
                if (err) reject(stderr || err.message);
                else resolve(stdout);
            });
        });
    }
};

module.exports = Voice;
