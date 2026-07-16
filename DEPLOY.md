# 🚀 Baǵdar Deployment Guide

## Architecture — Two Backends

```
                        ┌─────────────────────┐
                        │   Vercel (Hobby)     │
                        │                      │
                        │  ┌───────────────┐   │
   User ───────────────►│  │ Frontend (PWA) │   │
                        │  │  /frontend/dist │   │
                        │  └───────┬───────┘   │
                        │          │            │
                        │  ┌───────▼───────┐   │
                        │  │ API (Functions)│   │
                        │  │  Groq AI       │   │
                        │  │  gpt-oss-120b  │   │
                        │  └───────────────┘   │
                        └─────────────────────┘

   Future production server:
   Python FastAPI + Gemini (when you buy a server)
```

### Free Tier (Vercel Hobby + Groq)
- **Vercel Functions**: 1M invocations/mo, 4 CPU-hrs, 360 GB-hrs memory
- **Groq API**: Rate-limited but generous free tier, ~6000 req/day
- **~1000 users** fit comfortably within free limits

---

## Prerequisites

- Node.js 18+ installed
- [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`)
- GitHub account (for auto-deploy)
- **Groq API key** from [console.groq.com](https://console.groq.com)

---

## Quick Deploy

### 1. Set up environment

```bash
# Clone, then from project root:
npm install
cd frontend && npm install && cd ..
```

### 2. Deploy to Vercel

```bash
# One-command deploy:
vercel --prod

# You'll be prompted to:
# - Log in / create Vercel account
# - Link project
# - Set GROQ_API_KEY environment variable
```

### 3. Set Groq API Key

After first deploy, in **Vercel Dashboard → Your Project → Settings → Environment Variables**:

```
GROQ_API_KEY = gr_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Add to **Production** and **Preview** environments.

### 4. Re-deploy

```bash
vercel --prod
```

Done. Your backend is live at `https://your-project.vercel.app/api/health`.

---

## Local Development

### Option A: Vercel Dev (recommended)

```bash
# Terminal 1 — API + static files (Vercel dev server)
cd bagdar
vercel dev    # → http://localhost:3000

# Terminal 2 — Frontend hot-reload (Vite)
cd bagdar/frontend
npm run dev   # → http://localhost:5173
```

### Option B: With Python backend (legacy)

```bash
# Terminal 1 — Python backend
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend pointing to Python backend
cd frontend
set VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

---

## Project Structure

```
bagdar/
├── api/                      # Vercel Functions (NEW lightweight backend)
│   ├── _lib/
│   │   ├── types.ts          # Shared TypeScript types
│   │   ├── quotes.ts         # Kazakh+Russian wisdom quotes
│   │   ├── prompts.ts        # System prompts for 3 mentors
│   │   ├── schemas.ts        # JSON Schema for structured AI output
│   │   ├── groq.ts           # Groq client + structured generation
│   │   └── utils.ts          # CORS, response helpers, validation
│   ├── generate.ts           # POST /api/generate — main AI endpoint
│   └── health.ts             # GET /api/health
├── backend/                  # Python FastAPI (legacy, for future server)
├── frontend/                 # React PWA (unchanged)
├── vercel.json               # Vercel routing & function config
├── package.json              # Root deps (groq-sdk, uuid, vercel CLI)
└── .env.example              # Environment variable template
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/generate` | Generate learning roadmap (Groq AI) |
| GET | `/api/health` | Health check |
| POST | `/api/v1/generate` | Backward-compat alias (rewrite) |
| GET | `/api/v1/health` | Backward-compat alias (rewrite) |

### POST /api/generate

```json
{
  "topics": ["physics", "FastAPI"],
  "duration_minutes": 180,
  "persona": "abay",
  "level": "beginner"
}
```

Response: `{ plan: RoadmapResponse, quote: QuoteResponse }`

---

## CI/CD (GitHub Auto-Deploy)

This project uses **Vercel Git Integration**:

1. Push code to GitHub
2. Vercel automatically detects the push
3. Runs `npm install && cd frontend && npm install && npm run build`
4. Deploys Functions from `api/` + static files from `frontend/dist/`
5. Done.

> ⚠️ Make sure `GROQ_API_KEY` is set in Vercel Environment Variables.
> Without it, the API will return 502 errors.

---

## Remaining on GitHub

The following configs are already in place:

- `cloudbuild.yaml` — Google Cloud Build (for old Python backend)
- `Dockerfile` — Docker build (for old Python backend)
- `backend/Dockerfile` — Python container

These are kept for future use when you buy a dedicated server.

---

## Cost Breakdown (1000 users)

| Service | Cost |
|---------|------|
| Vercel Hobby | **$0/mo** (free tier) |
| Groq API | **$0/mo** (free tier, ~6000 req/day) |
| **Total** | **$0/mo** |

Everything fits comfortably within free limits.

---

## Troubleshooting

### ❌ API returns 502
- Check `GROQ_API_KEY` is set in Vercel Environment Variables
- Verify the key is valid at console.groq.com

### ❌ Frontend can't reach API
- On Vercel: API is same-domain, nothing to configure
- Local dev: set `VITE_API_BASE_URL=http://localhost:3000`

### ❌ CORS errors
- The API handles CORS automatically for known origins
- If testing from a custom domain, add it to `ALLOWED_ORIGINS` in `api/_lib/utils.ts`

### ❌ Cold start slow
- Vercel Functions cold start ~50ms for TypeScript
- If it's slower, ensure `nodejs@22` runtime is set in `vercel.json`
