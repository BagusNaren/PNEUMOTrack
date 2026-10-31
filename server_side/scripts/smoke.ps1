# Smoke test for the PNEUMOTrack backend.
# Usage: ./scripts/smoke.ps1 [-BaseUrl http://127.0.0.1:8000] [-Sample path\to\audio.m4a]
param(
    [string]$BaseUrl = "http://127.0.0.1:8000",
    [string]$Sample = ""
)

Write-Host "health:"
$health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
$health | ConvertTo-Json -Compress

if ([string]::IsNullOrWhiteSpace($Sample)) {
    Write-Host "no sample audio given; skipping /predict"
    exit 0
}

Write-Host "predict ($Sample):"
$form = @{ audio = Get-Item $Sample }
$response = Invoke-RestMethod -Uri "$BaseUrl/predict" -Method Post -Form $form
$response | ConvertTo-Json -Depth 6 -Compress
