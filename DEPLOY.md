# 🚀 Baǵdar Deployment Guide

## Architecture

```
                        ┌─────────────────────────────────┐
                        │      Vercel (Hobby — Free)       │
                        │                                  │
   User ───────────────►│  frontend/                       │
                        │    ├── dist/    (PWA static)     │
                        │    ├── api/     (Vercel Functions)│
                        │    └── vercel.json (config)      │
                        │                                  │
                        │  Groq AI — gpt-oss-120b          │
                        └─────────────────────────────────┘
```

### Free Tier — всё бесплатно
- **Vercel Hobby**: 1M invocations/mo, 4 CPU-hrs, 360 GB-hrs
- **Groq API**: щедрый free tier (~6000 req/day)
- **~1000 пользователей** — с большим запасом

---

## Prerequisites

- Node.js 18+
- [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`)
- **Groq API key** — получить на [console.groq.com](https://console.groq.com)

---

## Деплой

### 1. Зайти в папку frontend

```bash
cd frontend
npm install
```

### 2. Деплой одной командой

```bash
vercel --prod
```

Vercel попросит:
- Войти / создать аккаунт
- Создать проект
- Указать **Root Directory**: `frontend` (если спросит — уже по умолчанию)

### 3. Добавить GROQ_API_KEY

В **Vercel Dashboard → Settings → Environment Variables**:

```
GROQ_API_KEY = gr_твой_ключ
```

Добавить в окружения **Production** и **Preview**.

### 4. Передеплоить

```bash
vercel --prod
```

Готово. API доступен:
- `https://твой-проект.vercel.app/api/health`
- `https://твой-проект.vercel.app/api/generate`

---

## Local Development

```bash
# Терминал 1 — Vercel dev (API + статика на localhost:3000)
cd frontend
vercel dev

# Терминал 2 — Vite hot-reload
cd frontend
npm run dev   # → http://localhost:5173
```

В продакшене (Vercel) фронтенд и API на одном домене — env-var не нужен.  
Для локальной разработки с `vercel dev` тоже работает из коробки.

---

## Project Structure

```
bagdar/
├── frontend/                    # ← ВСЁ здесь (деплоится на Vercel)
│   ├── api/                     # Serverless Functions (TypeScript)
│   │   ├── _lib/
│   │   │   ├── types.ts         # Типы (общие с src/)
│   │   │   ├── quotes.ts        # Цитаты на казахском и русском
│   │   │   ├── prompts.ts       # Промпты: Аксакал, Абай, Номад
│   │   │   ├── schemas.ts       # JSON Schema для structured output
│   │   │   ├── groq.ts          # Groq client + генерация
│   │   │   └── utils.ts         # CORS, валидация, ответы
│   │   ├── generate.ts          # POST /api/generate
│   │   ├── health.ts            # GET /api/health
│   │   └── tsconfig.json
│   ├── src/                     # React PWA (без изменений)
│   ├── dist/                    # Сборка (генерируется)
│   └── vercel.json              # Настройки Vercel (роутинг, функции)
├── backend/                     # Python FastAPI (для будущего сервера)
├── DEPLOY.md                    # Этот файл
└── README.md                    # Описание проекта
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/generate` | Создать маршрут обучения (Groq AI) |
| GET | `/api/health` | Проверка здоровья |
| POST | `/api/v1/generate` | Алиас для совместимости |
| GET | `/api/v1/health` | Алиас для совместимости |

### Пример POST /api/generate

```json
{
  "topics": ["physics", "FastAPI"],
  "duration_minutes": 180,
  "persona": "abay",
  "level": "beginner"
}
```

Ответ: `{ plan: RoadmapResponse, quote: QuoteResponse }`

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
