@echo off
title 🌍 URLPathGuard Environment Setup
color 0B

echo ===============================================
echo 🧠 URLPathGuard - Environment Variable Setup
echo ===============================================
echo.

REM --- Prompt user for GEOIP DB Path ---
set /p GEOIP_PATH="Enter full path to GeoLite2-City.mmdb file (or press Enter to skip): "

if "%GEOIP_PATH%"=="" (
    echo ⚠️ No GeoIP DB path entered. Skipping...
) else (
    setx GEOIP_DB_PATH "%GEOIP_PATH%"
    echo ✅ GEOIP_DB_PATH set to: %GEOIP_PATH%
)

echo.

REM --- Prompt user for VirusTotal API Key ---
set /p VT_KEY="Enter your VirusTotal API Key (or press Enter to skip): "

if "%VT_KEY%"=="" (
    echo ⚠️ No VT API Key entered. Skipping...
) else (
    setx VT_API_KEY "%VT_KEY%"
    echo ✅ VT_API_KEY set successfully.
)

echo.
echo 🧩 Summary of Environment Variables:
echo -----------------------------------------------
if not "%GEOIP_PATH%"=="" echo GEOIP_DB_PATH=%GEOIP_PATH%
if not "%VT_KEY%"=="" echo VT_API_KEY=%VT_KEY%
echo -----------------------------------------------

echo.
echo ✅ Setup complete!
echo ⚙️  You can now run:  pipeline_full.bat
echo (Environment variables will be available in new CMD windows)
pause
