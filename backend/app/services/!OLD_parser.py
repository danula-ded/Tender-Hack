"""XLSX parsing utilities converting rows into `Product` models."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List

import pandas as pd

from app.models.product import Product


def _to_str(value: Any) -> str:
    """Safely convert a value to string, handling NaN values."""
    if value is None:
        return ""
    text = str(value)
    if text.lower() == "nan":
        return ""
    return text


def _parse_characteristics(raw: Any) -> Dict[str, Any]:
    """Parse characteristics from a cell value into a dictionary.

    Supported formats:
    - JSON object string: '{"color": "red", "size": "M"}'
    - Semicolon/pipe separated pairs: 'color: red; size: M' or 'color=red|size=M'
    - Already-a-dict values are returned as-is
    """
    if isinstance(raw, dict):
        return dict(raw)
    if raw is None:
        return {}
    text = _to_str(raw).strip()
    if not text:
        return {}
    if text.startswith("{") and text.endswith("}"):
        try:
            data = json.loads(text)
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError:
            # Fallback to heuristic parsing
            pass
    # Heuristic parsing 'key:value' or 'key=value' pairs separated by ; or |
    parts = re.split(r"[;|]+", text)
    parsed: Dict[str, Any] = {}
    for part in parts:
        if not part:
            continue
        if ":" in part:
            key, val = part.split(":", 1)
        elif "=" in part:
            key, val = part.split("=", 1)
        else:
            # Skip tokens that don't look like pairs
            continue
        key = key.strip()
        val = val.strip()
        if key:
            parsed[key] = val
    return parsed


def _find_column(candidates: Iterable[str], columns: List[str]) -> str:
    """Return the first matching column name from candidates (case-insensitive)."""
    lower = {c.lower(): c for c in columns}
    for cand in candidates:
        if cand.lower() in lower:
            return lower[cand.lower()]
    raise KeyError("Required column not found: one of %s" % ", ".join(candidates))


def parse_xlsx(file_path: Path) -> List[Product]:
    """Parse an XLSX file into a list of `Product` models.

    The following columns are supported (case-insensitive, with Russian synonyms):
    - name / название
    - description / описание
    - price / цена
    - characteristics / характеристики / attributes / атрибуты
    """
    df = pd.read_excel(file_path)
    columns = list(df.columns)
    name_col = _find_column(["name", "название", "product", "товар"], columns)
    desc_col = _find_column(["description", "описание"], columns) if any(
        c.lower() in {"description", "описание"} for c in columns
    ) else None
    price_col = _find_column(["price", "цена"], columns)
    char_col = _find_column(["characteristics", "характеристики", "attributes", "атрибуты", "attrs"], columns)

    products: List[Product] = []
    for _, row in df.iterrows():
        name = _to_str(row.get(name_col)) or "Unnamed"
        description = _to_str(row.get(desc_col)) if desc_col else None
        try:
            price_val = float(row.get(price_col))
        except (TypeError, ValueError):
            price_val = 0.0
        characteristics = _parse_characteristics(row.get(char_col))
        product = Product(
            id=0,  # will be reassigned by storage
            name=name,
            description=description or None,
            price=price_val,
            characteristics=characteristics,
            variants=[],
        )
        products.append(product)
    return products
