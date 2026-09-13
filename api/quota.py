"""Persistent daily request limits for a single backend instance."""

import sqlite3
from contextlib import closing
from datetime import UTC, datetime
from pathlib import Path

from fastapi import HTTPException


class DailyQuota:
    def __init__(self, path: Path, limit: int) -> None:
        self.path = path
        self.limit = limit

    def reserve(self, day: str | None = None) -> None:
        """Reserve an attempt before contacting the provider, including failed calls."""
        day = day or datetime.now(UTC).date().isoformat()
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            with closing(sqlite3.connect(self.path, timeout=5)) as connection:
                with connection:
                    # Acquire the write lock before reading to prevent concurrent overspending.
                    connection.execute("BEGIN IMMEDIATE")
                    connection.execute(
                        "CREATE TABLE IF NOT EXISTS usage "
                        "(day TEXT PRIMARY KEY, attempts INTEGER NOT NULL)"
                    )
                    connection.execute("INSERT OR IGNORE INTO usage VALUES (?, 0)", (day,))
                    used = connection.execute(
                        "SELECT attempts FROM usage WHERE day = ?", (day,)
                    ).fetchone()[0]
                    if used >= self.limit:
                        raise HTTPException(
                            429,
                            "Today's AI allowance is used. Enter filters manually, "
                            "or try tomorrow (UTC).",
                        )
                    connection.execute(
                        "UPDATE usage SET attempts = attempts + 1 WHERE day = ?", (day,)
                    )
        except (sqlite3.Error, OSError):
            raise HTTPException(
                503, "AI extraction is temporarily unavailable. Enter filters manually."
            ) from None
