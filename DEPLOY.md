# 🚀 Baǵdar Deployment Guide

## Обзор

- **Frontend**: React + TypeScript + Vite + PWA → Deploy на Vercel
- **Backend**: FastAPI + Python → Deploy на Google Cloud Run

---

## Part 1: Подготовка репозитория

### 1.1 Настройка Git
```bash
# В корневой папке проекта
git init
git add .
git commit -m "Initial commit: Baǵdar MVP"
```

### 1.2 Проверь .gitignore
Убедись что:
- `.env` не добавлен в git
- `node_modules/` игнорируется
- `__pycache__/` игнорируется

---

## Part 2: Vercel (Frontend)

### 2.1 Подготовка
```bash
cd frontend

# Установи vercel если нет
npm install -g vercel
```

### 2.2 Деплой
```bash
vercel --prod
```

Или через GitHub:
1. Запушь код на GitHub
2. Открой vercel.com
3. Import project → выбери репозиторий
4. Settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### 2.3 Environment Variables
В Vercel Dashboard → Settings → Environment Variables:
```
VITE_API_BASE_URL=https://your-backend-url.run.app
```

---

## Part 3: Google Cloud Run (Backend)

### 3.1 Подготовка Docker
Убедись что `backend/Dockerfile` существует и настроен правильно.

### 3.2 Деплой через Google Cloud Console

1. **Google Cloud Console**: https://console.cloud.google.com
2. **Cloud Run** → Create Service
3. Настройки:
   - Container image URL: (зальёшь позже)
   - Region: выбери closest (europe-west1)
   - Service name: `bagdar-api`
   - Authentication: Allow unauthenticated
4. **Variables**:
   - `GEMINI_API_KEY`: твой ключ Gemini
   - `ENVIRONMENT`: production
   - `LOG_LEVEL`: WARNING

### 3.3 Альтернатива: gcloud CLI
```bash
# Аутентификация
gcloud auth login

# Установка проекта
gcloud config set project YOUR_PROJECT_ID

# Сборка и деплой
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/bagdar-api
gcloud run deploy bagdar-api \
  --image gcr.io/YOUR_PROJECT_ID/bagdar-api \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=YOUR_KEY
```

### 3.4 Получи URL
После деплоя получишь URL типа:
```
https://bagdar-api-xxx-xxx-xxx.a.run.app
```

---

## Part 4: Подключение Frontend к Backend

### 4.1 Обнови Environment в Vercel
```
VITE_API_BASE_URL=https://bagdar-api-xxx-xxx-xxx.a.run.app
```

### 4.2 Обнови CORS в Backend
В `backend/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://твой-версель-домен.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4.3 Пересобери Frontend
```bash
cd frontend
npm run build
vercel --prod --force
```

---

## Проверка

1. **Backend**: https://bagdar-api-xxx.a.run.app/api/v1/health
2. **Frontend**: https://твой-проект.vercel.app
3. Попробуй создать маршрут

---

## Troubleshooting

### ❌ CORS ошибка
Проверь `allow_origins` в `main.py`

### ❌ 500 на /generate
Проверь логи в Cloud Run → Logs
Убедись что `GEMINI_API_KEY` установлен

### ❌ Старая версия
```bash
cd frontend
npm run build
vercel --prod --force
```

---

## Структура URLs после деплоя

| Сервис | URL |
|-------|-----|
| Backend API | `https://bagdar-api-xxx.a.run.app` |
| Frontend | `https://bagdar.vercel.app` |

---

## Cost Estimates

- **Vercel**: Free (для малых проектов)
- **Cloud Run**: ~$0-5/месяц (при малом использовании)
- **Gemini API**: платится по факту использования

---

**Готово! 🚀**