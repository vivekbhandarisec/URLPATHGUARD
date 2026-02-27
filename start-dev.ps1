$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $root "backend"
$frontendPath = Join-Path $root "frontend"
$backendPython = Join-Path $backendPath "venv\Scripts\python.exe"

if (-not (Test-Path $backendPython)) {
  Write-Error "Backend virtual environment not found at $backendPython"
}

$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCmd) {
  Write-Error "npm was not found in PATH. Install Node.js and try again."
}

Write-Host "Starting backend on http://127.0.0.1:8000 ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendPath'; & '$backendPython' -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

Start-Sleep -Seconds 1

Write-Host "Starting frontend on http://127.0.0.1:5173 ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendPath'; npm run dev"

Write-Host "Both services started in separate terminals."
