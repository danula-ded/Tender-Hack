"""Product and variant models used across the API layer."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ProductVariant(BaseModel):
    """A variant of a product that can override base attributes."""

    id: int
    characteristics: Dict[str, Any] = Field(default_factory=dict)
    price: Optional[float] = None
    name: Optional[str] = None
    is_active: bool = True

    def to_dict(self) -> Dict[str, Any]:
        """Return a plain dict representation compatible with Pydantic v1/v2."""
        if hasattr(self, "model_dump"):
            return self.model_dump()  # type: ignore[attr-defined]
        return self.dict()  # type: ignore[no-any-return]


class Product(BaseModel):
    """Product model with optional variants."""

    id: int
    name: str
    description: Optional[str] = None
    price: float
    characteristics: Dict[str, Any] = Field(default_factory=dict)
    variants: List[ProductVariant] = Field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Return a plain dict representation compatible with Pydantic v1/v2."""
        if hasattr(self, "model_dump"):
            return self.model_dump()  # type: ignore[attr-defined]
        return self.dict()  # type: ignore[no-any-return]

    def has_variants(self) -> bool:
        """Return True when the product has at least one variant."""
        return bool(self.variants)


class ProductUpdate(BaseModel):
    """Partial update for a product."""

    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    characteristics: Optional[Dict[str, Any]] = None
