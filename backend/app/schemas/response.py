from pydantic import BaseModel, Field
from typing import Literal


class ChecklistItem(BaseModel):
    text: str = Field(..., description="Конкретное действие или навык")
    type: Literal["theory", "math", "practice", "visual"] = Field(..., description="Тип: теория/математика/практика/визуализация")


class Step(BaseModel):
    id: str
    title: str
    duration: int = Field(..., ge=5, le=120, description="Длительность в минутах")
    description: str | None = None
    type: Literal["learning", "practice", "break"]
    order: int
    checklist: list[ChecklistItem] | None = Field(default_factory=list, description="Детальный чек-лист для изучения")


class Break(BaseModel):
    id: str
    duration: int = Field(..., ge=1, le=30, description="Длительность в минутах")
    message: str


class RoadmapResponse(BaseModel):
    id: str
    title: str
    total_duration: int
    steps: list[Step]
    breaks: list[Break]
    persona: str
    created_at: str


class QuoteResponse(BaseModel):
    kz: str
    ru: str


class GenerateResponse(BaseModel):
    plan: RoadmapResponse
    quote: QuoteResponse
