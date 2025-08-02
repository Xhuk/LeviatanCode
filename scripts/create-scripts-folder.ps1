# Create scripts folder if it doesn't exist
if (-not (Test-Path "scripts")) {
    New-Item -ItemType Directory -Path "scripts" -Force
    Write-Host "✅ Created scripts folder" -ForegroundColor Green
} else {
    Write-Host "✅ Scripts folder already exists" -ForegroundColor Green
}