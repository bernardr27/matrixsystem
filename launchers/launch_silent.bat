@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0.."

:: Create logs directory if it doesn't exist
if not exist "logs" mkdir "logs"

echo [SILENT LAUNCH] Starting Matrix Services... > logs\matrix_session.log
echo Timestamp: %DATE% %TIME% >> logs\matrix_session.log
echo Mode: Production (Stable Builds) >> logs\matrix_session.log

:: Kill old ports first
powershell -NoProfile -Command "foreach($p in 3000,3001,3005,4000,5173){$c=Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue;if($c){$c.OwningProcess|Select-Object -Unique|ForEach-Object{Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue}}}" >> logs\matrix_session.log 2>&1

:: Verify builds exist (auto-build if missing)
if not exist "apps\reflect\.next" (
    echo [BUILD] Building Reflect... >> logs\matrix_session.log
    pushd apps\reflect
    call npm run build --webpack >> ..\..\logs\matrix_session.log 2>&1
    popd
)

if not exist "apps\nexus\.next" (
    echo [BUILD] Building Nexus... >> logs\matrix_session.log
    pushd apps\nexus
    call npm run build --webpack >> ..\..\logs\matrix_session.log 2>&1
    popd
)

if not exist "apps\ghost-command\.next" (
    echo [BUILD] Building Ghost Command... >> logs\matrix_session.log
    pushd apps\ghost-command
    call npm run build --webpack >> ..\..\logs\matrix_session.log 2>&1
    popd
)

if not exist "apps\rocket-command\.next" (
    echo [BUILD] Building Rocket Command... >> logs\matrix_session.log
    pushd apps\rocket-command
    call npm run build --webpack >> ..\..\logs\matrix_session.log 2>&1
    popd
)

if not exist "apps\citadel\.next" (
    echo [BUILD] Building Citadel... >> logs\matrix_session.log
    pushd apps\citadel
    call npm run build --webpack >> ..\..\logs\matrix_session.log 2>&1
    popd
)

:: Run concurrently silently using PRODUCTION MODE
cd /d "%~dp0\.."

npx concurrently -k ^
  --names "SENTINEL,GHOST-CORE,REFLECT,NEXUS,CITADEL,ROCKET-CMD,GHOST-CMD" ^
  --prefix-colors "gray,yellow,cyan,magenta,green,blue,red" ^
  "node apps/ghost-command/core/sentinel.cjs" ^
  "node apps/ghost-command/core/ghost-runner.cjs" ^
  "cd apps/reflect && npm run start -- -p 3000" ^
  "cd apps/nexus && npm run start -- -p 3001" ^
  "node apps/citadel/guardian.cjs" ^
  "cd apps/rocket-command && npm run start -- -p 4000" ^
  "cd apps/ghost-command && npm run start -- -p 5173" >> logs\matrix_session.log 2>&1
