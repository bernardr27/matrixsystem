$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$outputDir = "G:\matrix\temp_mobile_verification"

if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir
}

# Define routes to check
$routes = @(
    @{ name = "nexus_dashboard_mobile"; url = "http://localhost:3001" },
    @{ name = "nexus_diagnostics_mobile"; url = "http://localhost:3001/diagnostics" },
    @{ name = "nexus_management_mobile"; url = "http://localhost:3001/management" },
    @{ name = "nexus_analytics_mobile"; url = "http://localhost:3001/analytics" },
    @{ name = "reflect_setup_mobile"; url = "http://localhost:3000/setup/initial" },
    @{ name = "reflect_auth_mobile"; url = "http://localhost:3000/auth" },
    @{ name = "reflect_tutorial_mobile"; url = "http://localhost:3000/tutorial" },
    @{ name = "reflect_session_mobile"; url = "http://localhost:3000/session" }
)

Write-Host "Initiating Mobile UI Capture (430x932: iPhone 16 Plus profile)..." -ForegroundColor Cyan

foreach ($route in $routes) {
    $name = $route.name
    $url = $route.url
    $outputPath = "$outputDir\$name.png"
    
    Write-Host "Capturing $name..." -ForegroundColor Cyan
    # iPhone 16 Plus viewport profile
    Start-Process $edgePath -ArgumentList "--headless", "--screenshot=`"$outputPath`"", "--window-size=430,932", "--user-agent=`"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1`"", $url -Wait
}

Write-Host "Mobile captures saved to $outputDir" -ForegroundColor Green
