# Run this in PowerShell from Blomso-OS-Frontend folder to push to GitHub.
# Usage: .\push-to-github.ps1

Set-Location $PSScriptRoot

Write-Host "=== Remote (before) ==="
git remote -v

# Use the Frontend repo URL (GitHub said the repo moved here)
git remote set-url origin https://github.com/RoanKovach/Blomso-OS-Frontend.git

Write-Host "`n=== Remote (after) ==="
git remote -v

Write-Host "`n=== Status ==="
git status --short

Write-Host "`n=== Staging all ==="
git add -A
git status --short

$status = git status --porcelain
if ($status) {
    Write-Host "`n=== Committing ==="
    git commit -m "fix: add .npmrc legacy-peer-deps for Amplify build"
    Write-Host "`n=== Pushing to origin main ==="
    git push -u origin main
} else {
    Write-Host "`nNothing to commit. Pushing existing commits..."
    git push -u origin main
}

Write-Host "`nDone."
