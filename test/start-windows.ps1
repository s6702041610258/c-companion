$ErrorActionPreference = 'Stop'
$testDirectory = Join-Path $env:RUNNER_TEMP ("c-companion-launcher-" + [guid]::NewGuid().ToString('N'))
$fakeBin = Join-Path $testDirectory 'bin'
New-Item -ItemType Directory -Path $fakeBin -Force | Out-Null
Copy-Item (Join-Path $PSScriptRoot '../start.ps1') $testDirectory
Copy-Item (Join-Path $PSScriptRoot '../package.json') $testDirectory
New-Item -ItemType Directory -Path (Join-Path $testDirectory 'ops') | Out-Null
Copy-Item (Join-Path $PSScriptRoot '../ops/check-hermes.mjs') (Join-Path $testDirectory 'ops')
Set-Content -Path (Join-Path $fakeBin 'docker.cmd') -Encoding ASCII -Value @'
@echo off
if "%~1"=="image" if "%~2"=="inspect" (
  if "%TEST_DOCKER_MODE%"=="healthy" exit /b 0
  if "%TEST_DOCKER_MODE%"=="app-missing" if not "%~3"=="c-companion:1.5.0" exit /b 0
  echo Error response from daemon: No such image 1>&2
  exit /b 1
)
if "%~1"=="compose" if "%~2"=="pull" (
  echo pull-hermes>>"%TEST_DOCKER_LOG%"
  exit /b 37
)
if "%~1"=="compose" if "%~2"=="build" (
  echo build-app>>"%TEST_DOCKER_LOG%"
  exit /b 37
)
if "%~1"=="compose" if "%~2"=="exec" (
  if not "%~6"=="-" exit /b 38
  more >"%TEST_DOCKER_INPUT%"
  echo check-stdin>>"%TEST_DOCKER_LOG%"
  exit /b 0
)
exit /b 0
'@

$originalPath = $env:PATH
$env:PATH = "$fakeBin;$originalPath"
$env:TEST_DOCKER_LOG = Join-Path $testDirectory 'docker.log'
$env:TEST_DOCKER_INPUT = Join-Path $testDirectory 'received-check.mjs'
try {
    $env:TEST_DOCKER_MODE = 'hermes-missing'
    $ErrorActionPreference = 'Continue'
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $testDirectory 'start.ps1') -NoBrowser *> $null
    $firstExit = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($firstExit -ne 1 -or -not (Select-String -Path $env:TEST_DOCKER_LOG -Pattern '^pull-hermes$' -Quiet)) {
        throw 'Missing Hermes image did not reach docker compose pull.'
    }

    New-Item -ItemType File -Path (Join-Path $testDirectory '.setup-ready') | Out-Null
    Clear-Content $env:TEST_DOCKER_LOG
    $env:TEST_DOCKER_MODE = 'app-missing'
    $ErrorActionPreference = 'Continue'
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $testDirectory 'start.ps1') -NoBrowser *> $null
    $secondExit = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($secondExit -ne 1 -or -not (Select-String -Path $env:TEST_DOCKER_LOG -Pattern '^build-app$' -Quiet)) {
        throw 'Missing app image did not reach docker compose build.'
    }

    Clear-Content $env:TEST_DOCKER_LOG
    $env:TEST_DOCKER_MODE = 'healthy'
    $ErrorActionPreference = 'Continue'
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $testDirectory 'start.ps1') -NoBrowser *> $null
    $thirdExit = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($thirdExit -ne 0 -or -not (Select-String -Path $env:TEST_DOCKER_LOG -Pattern '^check-stdin$' -Quiet)) {
        throw 'Ready launcher did not send the model check through standard input.'
    }
    & node --check $env:TEST_DOCKER_INPUT
    if ($LASTEXITCODE -ne 0) { throw 'The JavaScript sent by Windows PowerShell is invalid.' }
    Write-Host 'Windows launcher handles missing images and sends valid JavaScript to Node.'
} finally {
    $env:PATH = $originalPath
    Remove-Item Env:TEST_DOCKER_MODE -ErrorAction SilentlyContinue
    Remove-Item Env:TEST_DOCKER_LOG -ErrorAction SilentlyContinue
    Remove-Item Env:TEST_DOCKER_INPUT -ErrorAction SilentlyContinue
    Remove-Item $testDirectory -Recurse -Force
}
exit 0
