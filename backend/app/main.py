"""FastAPI application entry-point with routers and startup hooks."""
from __future__ import annotations

from fastapi import FastAPI

from app.api.groups import router as groups_router
from app.api.products import router as products_router
from app.api.upload import router as upload_router
from app.api.variants import router as variants_router
from app.core.config import ensure_dirs
from app.services.storage import storage

app = FastAPI(title="TenderHack Backend", version="0.1.0")

# Include routers
app.include_router(upload_router)
app.include_router(products_router)
app.include_router(variants_router)
app.include_router(groups_router)


@app.on_event("startup")
def _on_startup() -> None:
    """Prepare directories and mock data for development."""
    ensure_dirs()
    if not storage.products:
        # Minimal mock products to simplify frontend development without uploads
        from app.models.product import Product  # local import to avoid cycles

        storage.add_products(
            [
                Product(
                    id=0,
                    name="Widget A",
                    description="Basic widget",
                    price=99.9,
                    characteristics={"color": "red", "size": "M"},
                    variants=[],
                ),
                Product(
                    id=0,
                    name="Widget B",
                    description="Pro widget",
                    price=199.0,
                    characteristics={"color": "blue", "size": "L"},
                    variants=[],
                ),
            ]
        )


@app.get("/health")
def health() -> dict:
    """Simple liveness probe endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000)
