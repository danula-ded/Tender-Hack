"""Application configuration and filesystem paths."""
from __future__ import annotations

from pathlib import Path

# Project directories
BASE_DIR: Path = Path(__file__).resolve().parents[2]
DATA_DIR: Path = BASE_DIR / "data"
UPLOADED_DIR: Path = DATA_DIR / "uploaded"
TEMP_DIR: Path = DATA_DIR / "temp"


def ensure_dirs() -> None:
    """Ensure required directories exist for runtime operations."""
    for directory in (DATA_DIR, UPLOADED_DIR, TEMP_DIR):
        directory.mkdir(parents=True, exist_ok=True)
