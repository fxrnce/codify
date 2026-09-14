#!/usr/bin/env pwsh
# Validation helper. It deliberately does not stage, commit, or push files.

$ErrorActionPreference = "Stop"
$repositoryRoot = $PSScriptRoot

Push-Location $repositoryRoot
try {
    npm run lint
    npm run typecheck
    npx expo install --check

    Push-Location (Join-Path $repositoryRoot "backend")
    try {
        npm run prisma:validate
        npm run typecheck
        npm run build
        npm run test:admin
    }
    finally {
        Pop-Location
    }

    git diff --check
    git status --short
    Write-Host "Admin validation completed. Review the diff before committing." -ForegroundColor Green
}
finally {
    Pop-Location
}
