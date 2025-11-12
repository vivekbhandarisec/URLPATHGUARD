@echo off
title URLPathGuard — Full Pipeline (with Enrichment)
color 0A
setlocal

REM ------------------------------
echo ======================================================
echo 🚀 URLPathGuard — Setup & Run
echo ======================================================

REM ---------- 1) Virtual env ----------
if not exist "venv" (
    echo 🔧 Creating virtual environment...
    python -m venv venv
) else (
    echo ✅ Virtual environment already exists.
)

echo.
echo ▶ Activating virtual environment...
call venv\Scripts\activate.bat

REM ---------- 2) Install libs ----------
echo.
echo 📦 Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo ❌ Failed installing packages. Fix pip/requirements and re-run.
    pause
    exit /b 1
)

REM ---------- 3) Environment configuration ----------
echo.
echo ℹ️  Set optional environment variables now if needed.
echo   To skip VT lookups, leave VT_API_KEY empty.
echo.
echo Example (PowerShell): $env:VT_API_KEY='your_key_here'
echo Example (cmd): set VT_API_KEY=your_key_here
echo Example to set GeoIP path (cmd): set GEOIP_DB_PATH=%cd%\GeoLite2-City.mmdb
echo.

REM ---------- 4) Start Kafka via Docker Compose (optional) ----------
echo.
set /p START_DOCKER="Start Kafka docker-compose now? (y/N): "
if /I "%START_DOCKER%"=="y" (
    echo ▶ Starting Kafka (docker-compose up -d)...
    pushd kafka_docker
    docker-compose up -d
    popd
    echo ✅ Kafka startup requested. Wait a few seconds for containers to be healthy.
) else (
    echo ⚠️ Docker start skipped. Make sure Kafka is running on localhost:9092.
)

REM ---------- 5) Create Kafka topics (attempt automatic, will try docker) ----------
echo.
echo ▶ Creating Kafka topics (raw_logs, clean_logs, parsed_logs, detected_logs, alerts, enriched_alerts)...
REM Try docker exec approach (works when you used docker-compose with names kafka_docker-kafka-1)
docker ps -a > tmp_docker_ps.txt
findstr /i "kafka" tmp_docker_ps.txt > nul
if %errorlevel% equ 0 (
    echo Found docker containers, attempting to create topics using docker exec...
    REM adjust container name if different - try two common patterns
    docker exec kafka_docker-kafka-1 kafka-topics --create --topic raw_logs --bootstrap-server localhost:9092 --if-not-exists 2>nul || (
      docker exec kafka-docker_kafka_1 kafka-topics --create --topic raw_logs --bootstrap-server localhost:9092 --if-not-exists 2>nul || (
        echo Could not run docker exec topic creation automatically - you can create topics manually.
      )
    )
) else (
    echo Docker not detected or containers not present - skipping automatic topic creation.
)

del tmp_docker_ps.txt 2>nul

echo.
echo ℹ️ If topics are not created automatically, create them manually using:
echo    (Windows with kafka folder) ^> ^"bin\\windows\\kafka-topics.bat^" --create --topic raw_logs --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
echo or use docker exec with your kafka container name.
echo.

REM ---------- 6) Launch components ----------
echo ======================================================
echo ▶ Launching Producers -> Preprocess -> Parser -> Detection -> Enrichment
echo ======================================================

start "PCAP Producer" cmd /k "python backend\ingestion\pcap_producer.py"
start "IPDR Producer" cmd /k "python backend\ingestion\ipdr_producer.py"
start "Log Producer" cmd /k "python backend\ingestion\log_producer.py"

start "Preprocess Normalizer" cmd /k "python backend\preprocess\preprocess_normalize.py"
start "Preprocess Consumer" cmd /k "python backend\preprocess\preprocess_consumer.py"

start "Parser Feature Extractor" cmd /k "python backend\parser\parser_feature_extractor.py"
start "Detection Engine" cmd /k "python backend\detection\detection_engine.py"
start "Enrichment Engine" cmd /k "python backend\enrichment\enrichment_engine.py"

echo.
echo ✅ All components launched. Watch the windows for outputs.
echo Press ENTER to close this launcher (it will not stop the launched windows).
pause >nul
endlocal

