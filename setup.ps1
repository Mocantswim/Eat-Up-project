# ShiGuang Sport - Setup & Self-check script
# Usage: .\setup.ps1   or:  powershell -ExecutionPolicy Bypass -File .\setup.ps1

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
try { chcp 65001 | Out-Null } catch {}

Write-Host "=== ShiGuang Sport - Environment Setup ===" -ForegroundColor Cyan

# 1. Check Node.js
$nodeVersion = node -v 2>$null
if (-not $nodeVersion) {
    Write-Host "[ERROR] Node.js not found. Please install LTS: https://nodejs.org" -ForegroundColor Red
    Write-Host "After installing, reopen VS Code and run this script again."
    exit 1
}
Write-Host "[1/4] Node.js: $nodeVersion" -ForegroundColor Green

# 2. Install dependencies
Write-Host "[2/4] Installing npm dependencies (first time may take 2-5 min)..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] npm install failed. Check network / registry and retry." -ForegroundColor Red
    exit 1
}
Write-Host "[2/4] Dependencies installed" -ForegroundColor Green

# 3. TypeScript type check
#    IMPORTANT: use the local tsc only. Never let npx auto-download the unrelated
#    'tsc' package from npm registry when local TypeScript is missing.
$localTsc = "node_modules\.bin\tsc.cmd"
if (-not (Test-Path $localTsc)) {
    Write-Host "[WARN] TypeScript not found in node_modules, installing it..." -ForegroundColor Yellow
    npm install --save-dev typescript@~5.9.2
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install TypeScript." -ForegroundColor Red
        exit 1
    }
}
Write-Host "[3/4] Running TypeScript type check..." -ForegroundColor Yellow
& $localTsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] Type check found errors. Please paste the output above." -ForegroundColor Yellow
} else {
    Write-Host "[3/4] Type check passed" -ForegroundColor Green
}

# 4. Unit tests
Write-Host "[4/4] Running unit tests..." -ForegroundColor Yellow
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] Some tests failed. Please paste the output." -ForegroundColor Yellow
} else {
    Write-Host "[4/4] All tests passed" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Setup finished ===" -ForegroundColor Cyan
Write-Host "Start dev preview:  npx expo start"
Write-Host "Scan QR with Expo Go on your phone; or press 'a' for Android emulator."
Write-Host ""
Write-Host "If anything failed, paste the full terminal output to the developer." -ForegroundColor Yellow

