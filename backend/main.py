"""Entrypoint to run the FastAPI application via Uvicorn.

This module allows running the server locally with `python main.py` and keeps
the Dockerfile command consistent (`uvicorn app.main:app ...`).
"""
from __future__ import annotations

import uvicorn


def main() -> None:
    """Run development server on 0.0.0.0:8000."""
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()

