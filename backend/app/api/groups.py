"""API endpoints for generating and querying product groups (clusters)."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, HTTPException

from app.models.group import ProductGroup
from app.services.grouping_core_stub import core
from app.services.storage import storage

router = APIRouter(prefix="/api/groups", tags=["groups"])


@router.post("/generate")
def generate_groups() -> dict:
    """Run the grouping core over current products and persist the result."""
    products = storage.get_all_products()
    features = core.determine_significant_features(products)
    groups = core.group_products(products)
    # Attach features for visibility
    groups = [g.copy(update={"significant_features": features}) for g in groups]
    created = storage.save_groups(groups)
    return {"status": "ok", "created": created, "features": features}


@router.get("", response_model=List[ProductGroup])
def list_groups() -> List[ProductGroup]:
    """Return all groups."""
    return storage.list_groups()


@router.get("/{group_id}", response_model=ProductGroup)
def get_group(group_id: int) -> ProductGroup:
    """Return group details by ID."""
    try:
        return storage.get_group(group_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Group not found") from exc
