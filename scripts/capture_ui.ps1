$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$nexusDash = "http://localhost:3001/?noSplash=true"
$nexusAnal = "http://localhost:3001/analytics?noSplash=true"
$reflectDash = "http://localhost:3000/session?noSplash=true"
$outputDir = "G:\matrix\temp_verification"

# iPhone 16 Plus Emulation Flags (430px width)
$mobileUA = "--user-agent=""Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"""
$emulationFlags = "--window-size=430,3000", "--hide-scrollbars", "--force-device-scale-factor=3", $mobileUA

if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir
}

Write-Host "Capturing Nexus Dashboard (STRICT MOBILE)..." -ForegroundColor Cyan
Start-Process $edgePath -ArgumentList "--headless", "--screenshot=`"$outputDir\nexus_dashboard.png`"", "--virtual-time-budget=20000", $emulationFlags, $nexusDash -Wait
Start-Sleep -Seconds 2

Write-Host "Capturing Nexus Analytics (STRICT MOBILE)..." -ForegroundColor Cyan
Start-Process $edgePath -ArgumentList "--headless", "--screenshot=`"$outputDir\nexus_analytics.png`"", "--virtual-time-budget=15000", "--window-size=430,3000", "--hide-scrollbars", "--force-device-scale-factor=3", $mobileUA, $nexusAnal -Wait
Start-Sleep -Seconds 2

Write-Host "Capturing Reflect Session (STRICT MOBILE)..." -ForegroundColor Cyan
Start-Process $edgePath -ArgumentList "--headless", "--screenshot=`"$outputDir\reflect_session.png`"", "--virtual-time-budget=20000", "--window-size=430,3000", "--hide-scrollbars", "--force-device-scale-factor=3", $mobileUA, $reflectDash -Wait

Write-Host "Screenshots saved to $outputDir" -ForegroundColor Green
