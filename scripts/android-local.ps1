param(
    [ValidateSet('debug', 'release')]
    [string]$Variant = 'debug',
    [string]$Device,
    [switch]$Mock
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot

if ($Mock) {
    foreach ($line in Get-Content -LiteralPath (Join-Path $projectRoot '.env.example')) {
        if ($line -match '^(EXPO_PUBLIC_[A-Z0-9_]+)=(.*)$') {
            Set-Item -LiteralPath "Env:$($Matches[1])" -Value $Matches[2]
        }
    }
    $env:EXPO_PUBLIC_USE_MOCK_API = 'true'
    $env:EXPO_PUBLIC_USE_MOCK_DATA = 'true'
    # Mock builds need a valid client shape without a configured backend.
    $env:EXPO_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321'
    $env:EXPO_PUBLIC_SUPABASE_ANON_KEY = 'mock-client-placeholder'
    Write-Host 'Testing UI dengan data mock dan konfigurasi lokal contoh.'
}

if (-not $env:ANDROID_HOME) {
    $sdkPath = if ($env:ANDROID_SDK_ROOT) {
        $env:ANDROID_SDK_ROOT
    } else {
        Join-Path $env:LOCALAPPDATA 'Android/Sdk'
    }
    if (-not (Test-Path -LiteralPath $sdkPath)) {
        throw 'Android SDK tidak ditemukan. Install lewat Android Studio dan atur ANDROID_HOME.'
    }
    $env:ANDROID_HOME = $sdkPath
}

$bunCommand = Get-Command bun -ErrorAction SilentlyContinue
$bunPath = if ($bunCommand) {
    $bunCommand.Source
} else {
    Join-Path $env:USERPROFILE '.bun/bin/bun.exe'
}
if (-not (Test-Path -LiteralPath $bunPath)) {
    throw 'Bun tidak ditemukan. Install Bun terlebih dahulu.'
}
& node (Join-Path $PSScriptRoot 'check-local-env.cjs') $Variant
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    throw 'Java tidak ditemukan. Install JDK dan atur JAVA_HOME serta PATH.'
}

$env:PATH = "$(Split-Path -Parent $bunPath);$env:ANDROID_HOME/platform-tools;$env:ANDROID_HOME/emulator;$env:PATH"
# CMake 3.31.6 bundles Ninja with Windows long-path support.
if (-not [Environment]::GetEnvironmentVariable('ORG_GRADLE_PROJECT_android.cmakeVersion')) {
    [Environment]::SetEnvironmentVariable('ORG_GRADLE_PROJECT_android.cmakeVersion', '3.31.6', 'Process')
}
$cmakeVersion = [Environment]::GetEnvironmentVariable('ORG_GRADLE_PROJECT_android.cmakeVersion')
if (-not (Test-Path -LiteralPath (Join-Path $env:ANDROID_HOME "cmake/$cmakeVersion/bin/cmake.exe"))) {
    $sdkManager = Join-Path $env:ANDROID_HOME 'cmdline-tools/latest/bin/sdkmanager.bat'
    if (-not (Test-Path -LiteralPath $sdkManager)) {
        throw "Install CMake $cmakeVersion lewat Android Studio > SDK Tools, atau install Android SDK Command-line Tools (latest)."
    }
    & $sdkManager "--sdk_root=$env:ANDROID_HOME" "cmake;$cmakeVersion"
    if ($LASTEXITCODE -ne 0) {
        throw "Instalasi CMake $cmakeVersion gagal. Periksa jaringan dan lisensi Android SDK."
    }
}

$expoArgs = @('x', 'expo', 'run:android', '--variant', $Variant, '--device')
if ($Device) {
    $expoArgs += $Device
}
if ($Variant -eq 'release') {
    $expoArgs += '--no-bundler'
}

& $bunPath @expoArgs
exit $LASTEXITCODE
