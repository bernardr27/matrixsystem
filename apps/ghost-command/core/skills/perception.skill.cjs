const BaseSkill = require('./base.skill.cjs');
const Voice = require('../voice.cjs');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class PerceptionSkill extends BaseSkill {
    constructor(proxy) {
        super(proxy);
        this.name = 'perception_cortex';
    }

    getMissionTypes() {
        return ['sys:vocalize', 'sys:vision'];
    }

    async execute(mission) {
        const type = mission.payload?.type || (mission.title.includes('vision') ? 'sys:vision' : 'sys:vocalize');

        if (type === 'sys:vocalize') {
            const text = mission.payload?.text || mission.title.replace('vocalize:', '');
            await this.log(mission.id, `Vocalizing: "${text}"`);
            try {
                await Voice.speak(text);
                await this.log(mission.id, 'Vocalized successfully.', 'success');
            } catch (err) {
                await this.log(mission.id, `Vocalize failed: ${err.message}`, 'error');
                throw err;
            }
        }
        else if (type === 'sys:vision') {
            await this.log(mission.id, 'Initializing Screen Perception...');
            try {
                const timestamp = Date.now();
                const snapPath = path.join(process.cwd(), 'core', `snap_${timestamp}.png`);

                // PowerShell screen capture
                const psCommand = `
Add-Type -AssemblyName System.Windows.Forms
$screen = [System.Windows.Forms.Screen]::PrimaryScreen
$top = $screen.Bounds.Top
$left = $screen.Bounds.Left
$width = $screen.Bounds.Width
$height = $screen.Bounds.Height
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($left, $top, 0, 0, $bitmap.Size)
$bitmap.Save('${snapPath.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
`;
                execSync(`powershell -WindowStyle Hidden -NoProfile -Command "${psCommand}"`, { windowsHide: true });

                await this.log(mission.id, `Snapshot captured: snap_${timestamp}.png`, 'success');

                // If there's a prompt for analysis, we'd trigger neural vision here
                if (mission.payload?.analyze) {
                    await this.log(mission.id, 'Analyzing visual data via Moondream local bridge...', 'neural');
                    // Future: Integrate with Ollama Multimodal
                }
            } catch (err) {
                await this.log(mission.id, `Vision failed: ${err.message}`, 'error');
                throw err;
            }
        }
    }
}

module.exports = PerceptionSkill;
