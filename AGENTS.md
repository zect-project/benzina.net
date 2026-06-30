# benzina.net — agent instructions

## Stack

- **Backend:** Python 3.12+ · FastAPI async · SQLAlchemy 2.0 async · aiosqlite · Pydantic v2
- **Frontend:** React 19 · TypeScript · Vite 6 · Leaflet (map)
- **No tests, no linter, no formatter** — do not add unless asked.

## Quick start

```powershell
# Backend
cd backend
pip install -r requirements.txt
uvicorn backend.main:app --reload          # http://127.0.0.1:8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                                 # http://localhost:5173
```

## Seed data

```powershell
cd backend
python -m backend.seed all                  # fetch Overpass API + populate DB
python -m backend.seed fetch                # fetch + save to stations.json only
python -m backend.seed load                 # load stations.json into DB
```

`stations.json` is a pre-fetched snapshot (~970 stations, Novosibirsk region). DB (`benzina.db`) auto-creates tables on first startup.

## Architecture

- `backend/main.py` — FastAPI entrypoint, all 5 API routes
- `backend/database.py` — async SQLAlchemy engine + session factory
- `backend/models.py` — `Station` + `Report` tables
- `backend/schemas.py` — Pydantic request/response models
- `backend/seed.py` — Overpass API fetcher + JSON loader
- `frontend/src/main.tsx` — React entrypoint (includes ErrorBoundary)
- `frontend/src/App.tsx` — root component (map + bottom panel + report modal)
- `frontend/src/hooks/useStations.ts` — data fetching + search hook
- `frontend/src/api.ts` — API client, generates UUID in localStorage (`benzina_user_id`)
- `frontend/src/types.ts` — shared types + fuel/status constants (Russian labels)
- `frontend/src/components/` — `MapView`, `BottomPanel`, `StationDetails`, `StationListItem`, `ReportForm`
- Vite proxies `/api` → `http://127.0.0.1:8000` (`vite.config.ts`)

## Key quirks

- **No auth.** User identity is a random UUID stored in localStorage.
- **Report rate limit:** 10 minutes per user per station (returns 429).
- **Voting weight:** `min(5, 1 + total_reports // 20)` — starts at 1, max 5. Reports from users with weight 0 are ignored (never happens with current formula, but the `if weight == 0: continue` guard exists in backend).
- **CORS wide open** (`allow_origins=["*"]`).
- **All UI text is in Russian** — use Russian strings for any new UI.
- **Build** runs `tsc -b && vite build`.
- **No `.gitignore`** — `node_modules/`, `benzina.db`, `__pycache__/`, `.venv/` should be gitignored.

## API routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/stations?search=&user_id=` | List stations with aggregated fuel status |
| GET | `/api/stations/{id}?user_id=` | Station detail + all reports |
| POST | `/api/stations/{id}/report` | Submit fuel report (body: `fuel_92`, `fuel_95`, `fuel_98`, `fuel_diesel`, `user_id`) |
| GET | `/api/stats` | Overall counts |
| GET | `/api/user/stats?user_id=` | Per-user report count + weight |
