from fastapi import APIRouter

from app.api.v1.endpoints import generate, health

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
# Роутер generate уже содержит префикс "/generate" внутри своих декораторов,
# поэтому здесь мы подключаем его без дополнительного префикса, чтобы избежать пути /generate/generate
api_router.include_router(generate.router, tags=["roadmap"])
