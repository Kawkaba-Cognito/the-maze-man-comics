# Clears Vite's optimize cache and starts dev with --force (use if Training/splash still looks old).
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$viteDir = Join-Path $root 'node_modules\.vite'
if (Test-Path $viteDir) {
  Remove-Item -Recurse -Force $viteDir
  Write-Host 'Removed node_modules\.vite'
}

Write-Host 'Starting Vite with --force ...'
npx vite --force
