"""Stub of the grouping core to be replaced with a real ML/algorithm module later."""
from __future__ import annotations

from collections import Counter
from typing import Dict, Iterable, List

from app.models.group import ProductGroup
from app.models.product import Product


class GroupingCore:
    """Fake grouping core with deterministic placeholder logic."""

    def determine_significant_features(self, products: Iterable[Product]) -> List[str]:
        """Return a fake list of most frequent characteristic keys."""
        counter: Counter[str] = Counter()
        for product in products:
            counter.update(str(k) for k in product.characteristics.keys())
        if not counter:
            return []
        # Top 5 most common keys
        return [key for key, _ in counter.most_common(5)]

    def group_products(self, products: Iterable[Product]) -> List[ProductGroup]:
        """Return fake groups based on the first word of the product name."""
        buckets: Dict[str, List[int]] = {}
        for product in products:
            first_token = product.name.strip().split()[0].lower() if product.name.strip() else "misc"
            buckets.setdefault(first_token, []).append(product.id)
        groups: List[ProductGroup] = []
        for key, pids in buckets.items():
            score = 0.5 + 0.05 * len(pids)
            groups.append(
                ProductGroup(
                    id=0,  # will be set by storage
                    name=f"Group: {key}",
                    product_ids=pids,
                    score=round(score, 4),
                    significant_features=[],
                    meta={"method": "stub_first_token"},
                )
            )
        return groups


# Singleton stub instance
core = GroupingCore()
