const { exec } = require('child_process');

// Compile C# bridge for Mouse Control once (in-memory) if possible, 
// but for simplicity in this Node wrapper we'll use a specific PS script for each action 
// or a robust comprehensive script.

const PS_MOUSE_BRIDGE = `
Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);' -Name "User32" -Namespace Win32
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($args[0], $args[1])
if ($args[2] -eq "true") { [Win32.User32]::mouse_event(0x02, 0, 0, 0, 0); [Win32.User32]::mouse_event(0x04, 0, 0, 0, 0); }
`;

function executePS(command) {
    return new Promise((resolve, reject) => {
        exec(`powershell -NoProfile -Command "${command}"`, (err, stdout, stderr) => {
            if (err) return reject(stderr || err.message);
            resolve(stdout.trim());
        });
    });
}

const GhostHand = {
    // 1. Mouse Movement & Click
    // Usage: move(100, 100) or move(100, 100, true) for click
    move: async (x, y, click = false) => {
        // Escape args
        const safeX = parseInt(x) || 0;
        const safeY = parseInt(y) || 0;
        const doClick = click ? "true" : "false";

        // We inject the assembly loader every time. faster to keep a persistent process but this is MVP.
        const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
${PS_MOUSE_BRIDGE}
`;
        // Pass args to the script block? No, just inject values.
        // Actually, we can just inline the C# definition.

        const cmd = `
$code = '[DllImport("user32.dll")] public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);'
try { Add-Type -MemberDefinition $code -Name "Mouse" -Namespace Win32 -ErrorAction Stop } catch {}
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${safeX}, ${safeY})
${click ? '[Win32.Mouse]::mouse_event(0x02, 0, 0, 0, 0); [Win32.Mouse]::mouse_event(0x04, 0, 0, 0, 0);' : ''}
`;
        return executePS(cmd);
    },

    // 2. Click current position
    click: async () => {
        const cmd = `
$code = '[DllImport("user32.dll")] public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);'
try { Add-Type -MemberDefinition $code -Name "Mouse" -Namespace Win32 -ErrorAction Stop } catch {}
[Win32.Mouse]::mouse_event(0x02, 0, 0, 0, 0); 
[Win32.Mouse]::mouse_event(0x04, 0, 0, 0, 0);
`;
        return executePS(cmd);
    },

    // 3. Type Text
    type: async (text) => {
        // Sanitize for PowerShell string
        const safeText = text.replace(/'/g, "''").replace(/"/g, '`"');
        const cmd = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('${safeText}')
`;
        return executePS(cmd);
    },

    // 4. Hotkeys (e.g. ^{Esc} for Ctrl+Esc)
    // ^ = Ctrl, + = Shift, % = Alt
    hotkey: async (keys) => {
        const safeKeys = keys.replace(/'/g, "''");
        const cmd = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('${safeKeys}')
`;
        return executePS(cmd);
    }
};

module.exports = GhostHand;
