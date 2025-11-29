"""API endpoints for creating and managing product variants."""
from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, HTTPException

from app.models.product import ProductVariant
from app.services.storage import storage

router = APIRouter(prefix="/api/products", tags=["variants"])


@router.post("/{product_id}/variants", response_model=ProductVariant)
def create_variant(product_id: int) -> ProductVariant:
    """Create a new variant from the base product."""
    try:
        return storage.add_variant(product_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Product not found") from exc


@router.put("/{product_id}/variants/{variant_id}", response_model=ProductVariant)
def update_variant(product_id: int, variant_id: int, payload: Dict[str, Any]) -> ProductVariant:
    """Update fields of a variant and return it."""
    try:
        return storage.update_variant(product_id, variant_id, payload)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Variant not found") from exc


@router.delete("/{product_id}/variants/{variant_id}")
def delete_variant(product_id: int, variant_id: int) -> dict:
    """Delete a variant and return status."""
    try:
        storage.delete_variant(product_id, variant_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Variant not found") from exc
    return {"status": "ok"}
