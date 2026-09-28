param(
    [switch]$ChooseModel,
    [switch]$NoBrowser,
    [switch]$Rebuild
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

function Test-NativeCommand {
    param([string]$Executable, [string[]]$Arguments)

    # Windows PowerShell 5.1 can turn redirected native stderr into a terminating
    # error under Stop. Missing images and non-Git ZIP folders are expected here.
    $ErrorActionPreference = 'Continue'
    try {
        & $Executable @Arguments *> $null
        return ($LASTEXITCODE -eq 0)
    } catch {
        return $false
    }
}

function Run-Docker {
    # Let Docker report stderr, then decide success from its process exit code.
    $ErrorActionPreference = 'Continue'
    & docker @args
    if ($LASTEXITCODE -ne 0) { throw "Docker command failed (exit $LASTEXITCODE)." }
}

try {
    if (-not (Test-NativeCommand -Executable 'docker' -Arguments @('info'))) { throw 'Docker Desktop is not running.' }
    if (-not (Test-NativeCommand -Executable 'docker' -Arguments @('compose', 'version'))) { throw 'Docker Compose is unavailable.' }

    $environmentFile = Join-Path $PSScriptRoot '.env'
    if (-not (Test-Path $environmentFile)) {
        $bytes = New-Object byte[] 32
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
        $gatewayKey = ([System.BitConverter]::ToString($bytes)).Replace('-', '').ToLowerInvariant()
        $content = "HERMES_BASE_URL=http://hermes:8642/v1`nHERMES_API_KEY=$gatewayKey`nHERMES_MODEL=hermes-agent`nBIND_ADDRESS=127.0.0.1`nPORT=8091`n"
        [System.IO.File]::WriteAllText($environmentFile, $content, [System.Text.UTF8Encoding]::new($false))
        $gatewayKey = $null
    } elseif (-not ([System.IO.File]::ReadAllText($environmentFile).Contains('HERMES_BASE_URL=http://hermes:8642/v1'))) {
        throw 'This folder has settings from the old external-Hermes release. Extract the bundled release into a new folder.'
    }

    if (-not (Test-Path '.setup-ready')) { $ChooseModel = $true }

    Write-Host 'Preparing Hermes in Docker. The first download can take several minutes...'
    $hermesImage = 'nousresearch/hermes-agent@sha256:fca358f12efd65bfaaca05884166f15c0e2788375ca30d77061ac1ebc96452b7'
    if (-not (Test-NativeCommand -Executable 'docker' -Arguments @('image', 'inspect', $hermesImage))) {
        Run-Docker compose pull hermes
    }

    if ($ChooseModel) {
        [void](Test-NativeCommand -Executable 'docker' -Arguments @('compose', 'stop', 'app', 'monitor', 'hermes'))
        Write-Host 'Choose an AI provider, sign in or enter its API key, and choose a model in the Hermes menu.'
        Run-Docker compose run --rm --no-deps hermes model
        Run-Docker compose run --rm --no-deps --user 10000:10000 --entrypoint /opt/hermes/.venv/bin/python hermes /setup/harden_hermes.py
    }

    Write-Host 'Building and starting C Companion...'
    $appVersion = (Get-Content (Join-Path $PSScriptRoot 'package.json') -Raw | ConvertFrom-Json).version
    if (-not $appVersion) { throw 'Cannot read the app version from package.json.' }
    if (Get-Command git -ErrorAction SilentlyContinue) {
        if (Test-NativeCommand -Executable 'git' -Arguments @('rev-parse', '--verify', 'HEAD')) {
            if (Test-NativeCommand -Executable 'git' -Arguments @('diff', '--quiet', 'HEAD')) {
                $env:SOURCE_REVISION = (& git rev-parse HEAD).Trim()
            }
        }
    }
    $imageLine = [System.IO.File]::ReadAllLines($environmentFile) | Where-Object { $_.StartsWith('APP_IMAGE=') } | Select-Object -Last 1
    $appImage = if ($imageLine -and $imageLine.Substring(10)) { $imageLine.Substring(10) } else { "c-companion:$appVersion" }
    if ($Rebuild -or -not (Test-NativeCommand -Executable 'docker' -Arguments @('image', 'inspect', $appImage))) {
        Run-Docker compose build app
    } else {
        Write-Host "Using existing app image: $appImage"
    }
    Run-Docker compose up -d --wait --remove-orphans

    $checkPath = Join-Path $PSScriptRoot 'ops/check-hermes.mjs'
    $checkSource = Get-Content -LiteralPath $checkPath -Raw -Encoding UTF8
    $ErrorActionPreference = 'Continue'
    $checkSource | & docker compose exec -T app node -
    if ($LASTEXITCODE -ne 0) { throw "Docker command failed (exit $LASTEXITCODE)." }
    $ErrorActionPreference = 'Stop'

    [System.IO.File]::WriteAllText((Join-Path $PSScriptRoot '.setup-ready'), "ready`n")
    $portLine = [System.IO.File]::ReadAllLines($environmentFile) | Where-Object { $_.StartsWith('PORT=') } | Select-Object -Last 1
    $listenPort = if ($portLine) { $portLine.Substring(5) } else { '8091' }
    Write-Host "Ready at http://localhost:$listenPort"
    if (-not $NoBrowser) { Start-Process "http://localhost:$listenPort" }
} catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    exit 1
}
