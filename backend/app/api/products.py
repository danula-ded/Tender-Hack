"""API endpoints for listing and managing products."""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.models.product import Product, ProductUpdate
from app.services.storage import storage

router = APIRouter(prefix="/api/products", tags=["products"])


class ProductsListResponse(BaseModel):
    """Response model for paginated product lists."""

    items: List[Product]
    total: int


@router.get("", response_model=ProductsListResponse)
def list_products(
    query: Optional[str] = Query(default=None, alias="q"),
    limit: int = Query(default=50, ge=0),
    offset: int = Query(default=0, ge=0),
) -> ProductsListResponse:
    """Return a paginated list of products filtered by optional query string."""
    items, total = storage.get_filtered(query=query, limit=limit, offset=offset)
    return ProductsListResponse(items=items, total=total)


@router.get("/{product_id}", response_model=Product)
def get_product(product_id: int) -> Product:
    """Return product details by ID."""
    try:
        return storage.get_product(product_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Product not found") from exc


@router.put("/{product_id}", response_model=Product)
def update_product(product_id: int, payload: ProductUpdate) -> Product:
    """Apply partial updates to a product and return updated entity."""
    try:
        return storage.update_product(product_id, payload)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Product not found") from exc


@router.delete("/{product_id}")
def delete_product(product_id: int) -> dict:
    """Delete a product and return status."""
    try:
        storage.delete_product(product_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Product not found") from exc
    return {"status": "ok"}
