const { exec } = require('child_process');

console.log('--- DIAGNOSTIC: PORT CHECK ---');

const script = `
    $ports = @(3000, 3001, 5173);
    $results = @{};
    foreach ($p in $ports) {
        $conn = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1;
        if ($conn) {
            $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue;
            if ($proc) {
                Write-Output "PORT $p: ONLINE (PID: $($proc.Id))";
            } else {
                Write-Output "PORT $p: LISTEN (No PID)";
            }
        } else {
            Write-Output "PORT $p: OFFLINE";
        }
    }
`;

exec(`powershell -NoProfile -Command "${script}"`, { windowsHide: true }, (err, stdout, stderr) => {
    if (err) console.error('EXEC ERROR:', err);
    if (stderr) console.error('STDERR:', stderr);
    console.log(stdout);
});
```
