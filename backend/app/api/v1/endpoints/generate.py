import asyncio
from fastapi import APIRouter, HTTPException, status

from app.schemas.request import RoadmapRequest
from app.schemas.response import GenerateResponse
from app.services.gemini import gemini_service

router = APIRouter()


@router.post("/generate", response_model=GenerateResponse, status_code=status.HTTP_200_OK)
async def generate_roadmap(request: RoadmapRequest):
    try:
        result = await asyncio.to_thread(gemini_service.generate_roadmap, request)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка генерации маршрута: {str(e)}"
        )
