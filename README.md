# Triage Agent — Clinique Convent

AI-powered medical pre-consultation triage assistant. Built with:

- **Frontend**: React + Vite (deployed on Vercel)
- **Backend**: Express.js with Corti Agentic Framework

## Features

- French-language conversational triage powered by Corti AI
- Red-flag emergency detection with 15/112 call button
- Quick replies for frictionless mobile UX
- Speech-to-text input (Web Speech API)
- Clinical facts extraction via Corti FactsR™
- URL param pre-fill from booking systems

## Architecture

```
frontend/    → React + Vite SPA (Vercel)
backend/     → Express API proxy to Corti (Render / Railway / etc.)
```

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env
# Fill in your Corti credentials
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Environment Variables

See `backend/.env.example` for the full list.

| Variable | Description |
|---|---|
| `CORTI_CLIENT_ID` | Corti OAuth client ID |
| `CORTI_CLIENT_SECRET` | Corti OAuth client secret |
| `CORTI_TENANT` | Your Corti tenant name |
| `CORTI_ENVIRONMENT` | Corti environment (e.g. `eu`) |
| `FRONTEND_URL` | Allowed CORS origin (your Vercel URL in production) |

## Deployment

**Frontend (Vercel):** Connect this repo to Vercel, set root directory to `frontend/`, and add `VITE_API_URL` env var pointing to your backend URL.

**Backend:** Deploy to Render, Railway, or any Node.js host. Set all `CORTI_*` env vars and `FRONTEND_URL` to your Vercel domain.
