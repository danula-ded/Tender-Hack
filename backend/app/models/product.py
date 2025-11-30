from typing import Dict, Optional
from pydantic import BaseModel, field_validator
import pandas as pd

class Product(BaseModel):
    id: int
    original_id: str
    name: str
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    
    # ← ВОТ ЭТИ ПОЛЯ БЫЛИ ПРОБЛЕМОЙ
    country: Optional[str] = None          # было str → стало Optional[str]
    category_id: Optional[str] = None      # было str → стало Optional[str]
    category_name: Optional[str] = None
    image_url: Optional[str] = None

    characteristics: Dict[str, str] = {}
    group_id: Optional[str] = None

    # ← Автоматически приводим всё к строке или None
    @field_validator('country', 'category_id', 'category_name', 'model', 'manufacturer', 'image_url', mode='before')
    @classmethod
    def coerce_to_str_or_none(cls, v):
        if pd.isna(v) or v is None:
            return None
        return str(v).strip() if v != '' else None

    # original_id тоже на всякий случай
    @field_validator('original_id', mode='before')
    @classmethod
    def original_id_to_str(cls, v):
        if pd.isna(v) or v is None:
            return ""
        return str(v)