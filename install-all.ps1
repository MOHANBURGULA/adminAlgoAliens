Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "Installing frontend dependencies..."
Push-Location "algoaliens-frontend"
npm.cmd install
Pop-Location

Write-Host "Installing backend dependencies..."
Push-Location "edutech_complete"
npm.cmd install
Pop-Location

Write-Host "All dependencies installed."
