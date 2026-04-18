from pydantic import BaseModel, Field
from enum import Enum


class PersonaType(str, Enum):
    AKSAKAL = "aksakal"
    ABAY = "abay"
    NOMAD = "nomad"


class RoadmapRequest(BaseModel):
    topics: list[str] = Field(..., min_length=1, description="Список тем для изучения")
    duration_minutes: int = Field(..., gt=0, le=480, description="Общая длительность в минутах")
    persona: PersonaType = Field(default=PersonaType.ABAY, description="Тип наставника")
    level: str = Field(default="beginner", description="Уровень пользователя")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "topics": ["физика", "FastAPI"],
                    "duration_minutes": 180,
                    "persona": "abay",
                    "level": "beginner"
                }
            ]
        }
    }
