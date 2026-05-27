# Learning Bank — local dev startup
# Usage: .\dev.ps1

Write-Host "Starting Learning Bank dev environment..." -ForegroundColor Green

# Reuse the currently running PowerShell executable so this script works in
# Windows PowerShell 5.1 and PowerShell 7+.
$shellExe = (Get-Process -Id $PID).Path

# Start API
$api = Start-Process -FilePath $shellExe -ArgumentList '-NoProfile', '-Command', 'Set-Location "src\LearningBank.Api"; dotnet run' -PassThru -NoNewWindow

# Start web
$web = Start-Process -FilePath $shellExe -ArgumentList '-NoProfile', '-Command', 'Set-Location "src\learning-bank-web"; npm run dev' -PassThru -NoNewWindow

Write-Host ""
Write-Host "  API  → https://localhost:5001" -ForegroundColor Cyan
Write-Host "  Web  → http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop..." -ForegroundColor Yellow

try {
    Wait-Process -Id $api.Id, $web.Id
} finally {
    Stop-Process -Id $api.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $web.Id -ErrorAction SilentlyContinue
}
