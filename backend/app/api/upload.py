# backend/app/api/upload.py
from fastapi import APIRouter, File, UploadFile, HTTPException
import pandas as pd
import io
import logging
from app.services.preprocessor import preprocess_and_normalize
from app.services.storage import storage
from app.services.grouping_core import aggregate_df

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["upload"])

@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    content = await file.read()
    if not content:
        raise HTTPException(400, "Файл пустой")
    df = pd.read_excel(io.BytesIO(content))
    df_processed, warnings = preprocess_and_normalize(df.copy())
    storage.add_products(df_processed)
    groups = aggregate_df(df_processed)
    storage.apply_groups(groups)
    return {"status": "ok", "loaded": len(df_processed), "warnings": warnings}