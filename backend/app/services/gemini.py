import json
import uuid
from datetime import datetime, timezone

import google.generativeai as genai

from app.core.config import settings
from app.schemas.request import PersonaType, RoadmapRequest
from app.schemas.response import (
    Break,
    GenerateResponse,
    QuoteResponse,
    RoadmapResponse,
    Step,
)
from app.templates.prompts import CHECKLIST_REQUIREMENT, JSON_SCHEMA, QUOTE_TEMPLATES, SYSTEM_PROMPTS


class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    def generate_roadmap(self, request: RoadmapRequest) -> GenerateResponse:
        topics_text = ", ".join(request.topics)
        system_prompt = SYSTEM_PROMPTS[request.persona]

        user_prompt = f"""Создай план обучения на {request.duration_minutes} минут.
Темы: {topics_text}
Уровень: {request.level}

{CHECKLIST_REQUIREMENT}

Используй строго этот JSON-формат:
{JSON_SCHEMA}

Перемежай шаги типа "learning" и "practice" перерывами. Каждый перерыв — 5-15 минут."""

        response = self.model.generate_content(
            contents=f"{system_prompt}\n\n{user_prompt}",
            generation_config={"response_mime_type": "application/json"},
        )

        data = json.loads(response.text)

        steps = [
            Step(
                id=s["id"],
                title=s["title"],
                duration=s["duration"],
                description=s.get("description"),
                type=s["type"],
                order=s["order"],
                checklist=s.get("checklist", []),
            )
            for s in data["steps"]
        ]

        breaks = [
            Break(id=b["id"], duration=b["duration"], message=b["message"])
            for b in data.get("breaks", [])
        ]

        plan = RoadmapResponse(
            id=str(uuid.uuid4()),
            title=data["title"],
            total_duration=data["total_duration"],
            steps=steps,
            breaks=breaks,
            persona=data["persona"],
            created_at=datetime.now(timezone.utc).isoformat(),
        )

        quote_kz, quote_ru = QUOTE_TEMPLATES[request.persona]
        quote = QuoteResponse(kz=quote_kz, ru=quote_ru)

        return GenerateResponse(plan=plan, quote=quote)


gemini_service = GeminiService()
