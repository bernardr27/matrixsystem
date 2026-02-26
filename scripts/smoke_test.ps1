# Smoke test for Reflect API
param(
  [string]$BaseUrl = "http://localhost:3333"
)

Write-Host "Starting Reflect API smoke test against $BaseUrl" -ForegroundColor Cyan

# Start session
$startBody = @{ text = "I feel stuck choosing between two job offers and worry about making the wrong move."; mode = "career" } | ConvertTo-Json
$startResp = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/session/start" -ContentType "application/json" -Body $startBody
Write-Host "Start response:" -ForegroundColor Green
$startResp | ConvertTo-Json -Depth 4 | Write-Output

$sessionId = $startResp.id
if (-not $sessionId) { throw "No session id returned" }

# Save answer
$answerBody = @{ answer = "I will reach out to two mentors and list pros/cons by Friday." } | ConvertTo-Json
$answerResp = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/session/$sessionId/answer" -ContentType "application/json" -Body $answerBody
Write-Host "Answer response:" -ForegroundColor Green
$answerResp | ConvertTo-Json -Depth 4 | Write-Output

# List archive
$archiveResp = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/sessions"
Write-Host "Archive response (first 5):" -ForegroundColor Green
$archiveResp.sessions | Select-Object -First 5 | Format-Table -AutoSize
