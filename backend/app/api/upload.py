"""API endpoints for uploading XLSX files and ingesting products."""
from __future__ import annotations

import shutil
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.config import UPLOADED_DIR, ensure_dirs
from app.services.parser import parse_xlsx
from app.services.storage import storage

router = APIRouter(prefix="/api", tags=["upload"])


class UploadResponse(BaseModel):
    """Response model for upload endpoint."""

    status: str
    loaded: int


@router.post("/upload", response_model=UploadResponse)
async def upload(upload_file: UploadFile = File(..., alias="file")) -> UploadResponse:  # noqa: B008 (FastAPI signature)
    """Receive an XLSX file, parse it and store products in memory."""
    ensure_dirs()
    suffix = Path(upload_file.filename or "uploaded.xlsx").suffix or ".xlsx"
    fname = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex}{suffix}"
    target = UPLOADED_DIR / fname
    try:
        with target.open("wb") as out_f:
            shutil.copyfileobj(upload_file.file, out_f)
    except OSError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {exc}") from exc

    try:
        products = parse_xlsx(target)
        loaded = storage.add_products(products)
    except Exception as exc:  # pylint: disable=broad-except
        raise HTTPException(status_code=400, detail=f"Failed to parse XLSX: {exc}") from exc
    return UploadResponse(status="ok", loaded=loaded)
