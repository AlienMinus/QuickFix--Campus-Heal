# Smart Campus QuickFix - 1-Click APK Build Script

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host ">>> 1. Building Vite React Web Assets..." -ForegroundColor Cyan
Push-Location -Path "client"
npm run build

Write-Host ""
Write-Host ">>> 2. Syncing assets to Capacitor Android project..." -ForegroundColor Cyan
npx cap sync android

Write-Host ""
Write-Host ">>> 3. Compiling Android APK with Gradle..." -ForegroundColor Cyan
Push-Location -Path "android"

# Set JDK 21 and Android SDK environment variables
$env:JAVA_HOME = "C:\Users\minus\.jdks\jdk-21.0.12.1+1"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# Ensure gradle-wrapper uses cached Gradle 8.13-bin
$wrapperFile = "gradle\wrapper\gradle-wrapper.properties"
if (Test-Path $wrapperFile) {
    (Get-Content $wrapperFile) -replace "gradle-8.14.3-all.zip", "gradle-8.13-bin.zip" | Set-Content $wrapperFile
}

.\gradlew.bat assembleDebug
if ($LASTEXITCODE -ne 0) {
    Write-Host "Gradle build failed with exit code $LASTEXITCODE" -ForegroundColor Red
    Pop-Location
    Pop-Location
    exit 1
}

Pop-Location
Pop-Location

# Copy output APK to project root
Copy-Item "client\android\app\build\outputs\apk\debug\app-debug.apk" -Destination "SmartCampusQuickFix-debug.apk" -Force

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host " SUCCESS: APK Generated Successfully!    " -ForegroundColor Green
Write-Host " File: SmartCampusQuickFix-debug.apk     " -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
