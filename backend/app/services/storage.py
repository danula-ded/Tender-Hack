"""In-memory storage for products and groups.

This module provides a simple in-memory storage that can be replaced by a
persistent database in the future (e.g., PostgreSQL).
"""
from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional, Tuple

from pydantic import BaseModel

from app.models.group import ProductGroup
from app.models.product import Product, ProductUpdate, ProductVariant


def _dump(model: BaseModel) -> Dict[str, Any]:
    """Return a dict of model fields excluding unset, compatible with Pydantic v1/v2."""
    if hasattr(model, "model_dump"):
        return model.model_dump(exclude_unset=True)  # type: ignore[attr-defined]
    return model.dict(exclude_unset=True)  # type: ignore[no-any-return]


def _copy_update(model: BaseModel, update: Dict[str, Any]) -> BaseModel:
    """Compatibility wrapper for model copy with update across Pydantic v1/v2."""
    if hasattr(model, "model_copy"):
        return model.model_copy(update=update)  # type: ignore[attr-defined]
    return model.copy(update=update)


class Storage:
    """Stateful in-memory storage of products and groups."""

    def __init__(self) -> None:
        self.products: Dict[int, Product] = {}
        self.groups: Dict[int, ProductGroup] = {}
        self._next_product_id = 1
        self._next_variant_id = 1
        self._next_group_id = 1

    # ----------------------- Products -----------------------
    def add_products(self, items: Iterable[Product]) -> int:
        """Add a batch of products, assigning new IDs. Returns number added."""
        count = 0
        for item in items:
            new_id = self._next_product_id
            self._next_product_id += 1
            stored = _copy_update(item, {"id": new_id})
            self.products[new_id] = stored
            count += 1
        return count

    def get_all_products(self) -> List[Product]:
        """Return all stored products."""
        return list(self.products.values())

    def get_filtered(self, query: Optional[str], limit: int, offset: int) -> Tuple[List[Product], int]:
        """Return filtered and paginated products and the total count."""
        items = list(self.products.values())
        if query:
            q = query.lower().strip()
            def matches(p: Product) -> bool:
                if q in p.name.lower():
                    return True
                if p.description and q in p.description.lower():
                    return True
                if q in str(p.price).lower():
                    return True
                for key, value in p.characteristics.items():
                    if q in str(key).lower() or q in str(value).lower():
                        return True
                for var in p.variants:
                    if var.name and q in var.name.lower():
                        return True
                return False
            items = [p for p in items if matches(p)]
        total = len(items)
        start = max(0, offset)
        end = start + max(0, limit)
        return items[start:end], total

    def get_product(self, product_id: int) -> Product:
        """Get a product by ID."""
        return self.products[product_id]

    def update_product(self, product_id: int, data: ProductUpdate) -> Product:
        """Update product fields from a `ProductUpdate` model and return the updated product."""
        current = self.products[product_id]
        update_data = _dump(data)
        updated = _copy_update(current, update_data)
        self.products[product_id] = updated
        return updated

    def delete_product(self, product_id: int) -> None:
        """Delete a product by ID."""
        del self.products[product_id]

    # ----------------------- Variants -----------------------
    def add_variant(self, product_id: int) -> ProductVariant:
        """Create a variant from a base product and return it."""
        product = self.products[product_id]
        variant_id = self._next_variant_id
        self._next_variant_id += 1
        variant = ProductVariant(
            id=variant_id,
            name=f"{product.name} (variant {variant_id})",
            price=product.price,
            characteristics=dict(product.characteristics),
            is_active=True,
        )
        product.variants.append(variant)
        # Persist the updated product
        self.products[product_id] = product
        return variant

    def update_variant(self, product_id: int, variant_id: int, data: Dict[str, Any]) -> ProductVariant:
        """Update a product variant and return it."""
        product = self.products[product_id]
        for idx, var in enumerate(product.variants):
            if var.id == variant_id:
                allowed = {k: v for k, v in data.items() if k in {"name", "price", "characteristics", "is_active"}}
                updated = _copy_update(var, allowed)  # type: ignore[assignment]
                product.variants[idx] = updated
                self.products[product_id] = product
                return updated
        raise KeyError(f"Variant {variant_id} not found for product {product_id}")

    def delete_variant(self, product_id: int, variant_id: int) -> None:
        """Delete a variant from a product."""
        product = self.products[product_id]
        product.variants = [v for v in product.variants if v.id != variant_id]
        self.products[product_id] = product

    # ----------------------- Groups -----------------------
    def save_groups(self, groups: Iterable[ProductGroup]) -> int:
        """Replace current groups with the provided ones, assigning new IDs."""
        self.groups.clear()
        self._next_group_id = 1
        count = 0
        for group in groups:
            gid = self._next_group_id
            self._next_group_id += 1
            stored = _copy_update(group, {"id": gid})
            self.groups[gid] = stored
            count += 1
        return count

    def list_groups(self) -> List[ProductGroup]:
        """Return all groups."""
        return list(self.groups.values())

    def get_group(self, group_id: int) -> ProductGroup:
        """Return a single group by ID."""
        return self.groups[group_id]


# Singleton storage instance for the application runtime
storage = Storage()
