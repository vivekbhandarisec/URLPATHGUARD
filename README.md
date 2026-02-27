# URLPathGuard

URLPathGuard is a full-stack web attack detection platform with:
- `backend`: FastAPI APIs for log parsing, attack detection, stats, and alert details
- `frontend`: enterprise-style website + SOC dashboard for trial upload, monitoring, and triage

## Prerequisites
- Python 3.10+
- Node.js 18+ and npm

## Setup
1. Backend
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

2. Frontend
```powershell
cd frontend
npm install
```

## Run
From project root:
```powershell
.\start-dev.ps1
```

Or:
```powershell
dev.bat
```

Services:
- Backend: `http://127.0.0.1:8000`
- Frontend: `http://127.0.0.1:5173`

## Core API Endpoints
- `GET /api/alerts`
- `GET /api/alerts/{id}`
- `GET /api/stats`
- `GET /api/system-status`
- `POST /api/upload-log`

## Health Check
```powershell
curl http://127.0.0.1:8000/health
```
