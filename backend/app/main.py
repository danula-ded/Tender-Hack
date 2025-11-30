# backend/app/main.py
# Фиксим: удаляем mock data, добавляем все routers
from fastapi import FastAPI
from app.api.groups import router as groups_router
from app.api.upload import router as upload_router
from app.api.download import router as download_router
from app.api.products import router as products_router  # Если есть
from app.core.config import ensure_dirs

app = FastAPI(title="TenderHack Backend", version="0.1.0")

app.include_router(upload_router)
app.include_router(groups_router)
app.include_router(download_router)
app.include_router(products_router)  # Если используется

@app.on_event("startup")
def _on_startup() -> None:
    ensure_dirs()

@app.get("/health")
def health() -> dict:
    return {"status": "ok"}