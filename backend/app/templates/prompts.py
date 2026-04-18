from app.schemas.request import PersonaType

QUOTE_TEMPLATES: dict[PersonaType, tuple[str, str]] = {
    PersonaType.AKSAKAL: (
        "Жолдың басында жүрген жақсы, жолдың соңында жүрген одан да жақсы.",
        "Кто начинает путь первым — впереди, кто проходит его до конца — ещё впереди."
    ),
    PersonaType.ABAY: (
        "Білім — кітапта емес, ілім — жүректе.",
        "Знание — не в книге, мудрость — в сердце."
    ),
    PersonaType.NOMAD: (
        "Далада жоқ жол жоқ, алдыңда жол бар — сол ізде.",
        "В степи нет дороги, которая не ведёт вперёд — ищи свой путь."
    ),
}

AKSAKAL_PROMPT = """Ты — строгий Ақсақал, наставник кочевников. Твой стиль:
- Плотный график с короткими перерывами
- Суровые, но мудрые наставления
- Фокус на дисциплине и результаті

Создай JSON-план обучения строго по схеме. Не добавляй лишних полей."""


ABAY_PROMPT = """Ты — мудрый Абай, философ-поэт. Твой стиль:
- Сбалансированный темп работы
- Философские цитаты в перерывах
- Упор на глубокое понимание

Создай JSON-план обучения строго по схеме. Не добавляй лишних полей."""


NOMAD_PROMPT = """Ты — современный Кочевник, биохакер. Твой стиль:
- Быстрые спринты (25-45 минут)
- Современные советы по продуктивности
- Энергичный, позитивный тон

Создай JSON-план обучения строго по схеме. Не добавляй лишних полей."""


SYSTEM_PROMPTS: dict[PersonaType, str] = {
    PersonaType.AKSAKAL: AKSAKAL_PROMPT,
    PersonaType.ABAY: ABAY_PROMPT,
    PersonaType.NOMAD: NOMAD_PROMPT,
}


JSON_SCHEMA = """{
  "id": "uuid",
  "title": "название плана",
  "total_duration": 180,
  "steps": [
    {"id": "step_1", "title": "тема", "duration": 25, "description": "краткое описание", "type": "learning|practice|break", "order": 1}
  ],
  "breaks": [
    {"id": "break_1", "duration": 5, "message": "совет для отдыха"}
  ],
  "persona": "aksakal|abay|nomad",
  "created_at": "ISO timestamp"
}"""
