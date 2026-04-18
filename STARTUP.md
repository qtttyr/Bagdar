# 🚀 Baǵdar — Запуск проекта

## 📋 Обзор

Baǵdar — это высокопроизводительное PWA-приложение на базе AI для автоматического построения образовательных маршрутов. Проект состоит из двух частей:

- **Backend**: FastAPI (Python) — генерирует маршруты с помощью Gemini AI
- **Frontend**: React + TypeScript + Tailwind — красивый интерфейс с интерактивной визуализацией

---

## 🛠️ Требования

### Общие
- Node.js 16+ (для фронтенда)
- Python 3.10+ (для бэкенда)
- Git

### Backend
- `pip` (обычно идёт с Python)
- Gemini API ключ (получить на https://ai.google.dev)

### Frontend
- `npm` (идёт с Node.js)

---

## 📦 Подготовка

### 1️⃣ Клонирование репозитория

```bash
cd C:\Bagdar
```

### 2️⃣ Получение Gemini API ключа

1. Перейдите на https://ai.google.dev
2. Получите API ключ
3. Сохраните его — понадобится для бэкенда

---

## 🔙 Запуск Backend

### Шаг 1: Установка зависимостей

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

### Шаг 2: Конфигурация

Создайте файл `.env` в папке `backend`:

```env
GEMINI_API_KEY=ваш_ключ_здесь
```

### Шаг 3: Запуск сервера

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Вывод должен быть похож на:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

✅ Backend работает на `http://localhost:8000`

**Доступные endpoints:**
- `GET /` — главная страница API
- `GET /docs` — интерактивная документация (Swagger UI)
- `POST /api/v1/generate` — генерация маршрута
- `GET /api/v1/health` — проверка здоровья

---

## 🎨 Запуск Frontend

### Шаг 1: Установка зависимостей

```bash
cd frontend
npm install
```

### Шаг 2: Запуск dev-сервера

```bash
npm run dev
```

**Вывод:**
```
VITE v8.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h + enter to show help
```

✅ Frontend готов на `http://localhost:5173`

---

## 🌐 Тестирование приложения

1. Откройте браузер: **http://localhost:5173**
2. Вы увидите красивый интерфейс BaǓdar с:
   - Формой для ввода тем, времени и выбора наставника
   - Live-preview маршрута
   - Интерактивной визуализацией

3. **Введите параметры:**
   - Темы: `физика, FastAPI` (или любые другие)
   - Время: `180` минут
   - Наставник: выберите один из трёх стилей
   - Уровень: выберите подходящий

4. **Нажмите «✨ Сгенерировать»**

5. **Результат:** Вы получите:
   - Интерактивную карту маршрута с "станциями"
   - Каждую станцию можно кликать — появляется волна "Импульса"
   - "Мудрость дня" — цитату на казахском и русском

---

## 🧪 Полный цикл разработки

### Terminal 1 — Backend
```bash
cd C:\Bagdar\backend
# Активируем виртуальное окружение
.venv\Scripts\activate
# Запускаем сервер
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 — Frontend
```bash
cd C:\Bagdar\frontend
npm run dev
```

### Terminal 3 (опционально) — Проверка
```bash
# Проверяем здоровье API
curl http://localhost:8000/api/v1/health

# Проверяем основную страницу
curl http://localhost:8000
```

---

## 🏗️ Production Build

### Frontend

```bash
cd frontend
npm run build
# Результат: папка `dist/` готова для деплоя
```

### Backend

```bash
cd backend
# Убедитесь, что .env содержит GEMINI_API_KEY
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

---

## 🐛 Troubleshooting

### ❌ Backend не запускается: "ModuleNotFoundError"
**Решение:**
```bash
cd backend
source .venv/bin/activate  # или .venv\Scripts\activate на Windows
pip install -r requirements.txt
```

### ❌ Frontend не подключается к backend: "Failed to fetch"
**Проверьте:**
1. Backend запущен на `http://localhost:8000`
2. CORS включен (в `backend/app/main.py`)
3. В браузере откройте http://localhost:8000/docs — должна быть Swagger UI

### ❌ Ошибка: "GEMINI_API_KEY not found"
**Решение:**
```bash
# Создайте backend/.env
echo "GEMINI_API_KEY=ваш_ключ" > backend/.env
# Перезагрузите backend
```

### ❌ Porty заняты
**Backend (8000):**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :8000
kill -9 <PID>
```

**Frontend (5173):**
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5173
kill -9 <PID>
```

---

## 📁 Структура проекта

```
C:\Bagdar
├── backend/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── services/         # Gemini AI service
│   │   ├── schemas/          # Pydantic models
│   │   ├── templates/        # Prompts
│   │   └── main.py           # FastAPI app
│   ├── requirements.txt
│   ├── .env                  # (создайте сами)
│   └── .venv/                # Virtual environment
│
├── frontend/
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── pages/            # Pages
│   │   ├── types/            # TypeScript types
│   │   ├── lib/              # Utilities
│   │   ├── App.tsx           # Main app
│   │   └── App.css           # Styles
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── STARTUP.md                # Этот файл
```

---

## 🎯 Следующие шаги

### Phase 1 (текущий MVP)
✅ Красивый UI с формой
✅ Интеграция с backend API
✅ Интерактивная визуализация маршрута
✅ "Мудрость дня" (цитаты)

### Phase 2 (планируется)
- 📊 Улучшенная визуализация (кривые линии, graph layout)
- 💾 Сохранение планов (локально + cloud)
- 🔗 Sharing маршрутов (URL)
- 📱 PWA манифест + offline support

### Phase 3 (будущее)
- 🔐 Аутентификация пользователей
- 📈 Аналитика использования
- 🌙 Dark mode (уже готов в CSS!)
- 🌍 Мультиязычность

---

## 📚 Документация

- **Backend Swagger UI**: http://localhost:8000/docs
- **Frontend**: http://localhost:5173
- **TypeScript типы**: `frontend/src/types/api.ts`

---

## ⚡ Быстрые команды

```bash
# Одновременный запуск обоих (если есть GNU Make или используется bash)
# Backend
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload &
# Frontend
cd frontend && npm run dev

# Проверка build
cd frontend && npm run build

# Линтинг
cd frontend && npm run lint
```

---

## 🤝 Поддержка

Если возникнут вопросы:
1. Проверьте логи в обоих терминалах
2. Убедитесь, что порты 8000 и 5173 свободны
3. Проверьте, что API ключ Gemini корректный
4. Перезагрузите оба сервера

---

## 🎨 Дизайн философия

Baǵdar объединяет:
- **Степной минимализм**: простота, пространство, природные цвета
- **AI мудрость**: "голоса" наставников (Аксакал, Абай, Номад)
- **Культурный код Казахстана**: цитаты, философия, уважение к времени

Каждый интерфейсный элемент — это "станция" на пути к знанию. 🗺️

---

**Успешной работы! 🚀**
