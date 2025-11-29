"""Models describing product groups used for aggregation results."""
from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel, Field


class ProductGroup(BaseModel):
    """Represents a group (cluster) of products."""

    id: int
    name: str
    product_ids: List[int] = Field(default_factory=list)
    score: float = 0.0
    significant_features: List[str] = Field(default_factory=list)
    meta: Dict[str, Any] = Field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Return a plain dict representation compatible with Pydantic v1/v2."""
        if hasattr(self, "model_dump"):
            return self.model_dump()  # type: ignore[attr-defined]
        return self.dict()  # type: ignore[no-any-return]

    def size(self) -> int:
        """Return number of products in the group."""
        return len(self.product_ids)
