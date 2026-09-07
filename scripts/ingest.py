"""
ingest.py — Boilerplate ingestion script for the vidya knowledge log.

Scans every Markdown file under `raw/`, extracts YAML frontmatter
(`date`, `tags`), and groups entries chronologically so they can be
handed off to a downstream LLM pipeline (trend discovery, embeddings, etc.).

Usage:
    python scripts/ingest.py
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Any

import yaml

RAW_DIR = Path(__file__).resolve().parent.parent / "raw"

FRONTMATTER_PATTERN = re.compile(r"^---\s*\n(.*?)\n---\s*\n(.*)$", re.DOTALL)


@dataclass
class LogEntry:
    """A single parsed daily-log Markdown file."""

    path: Path
    date: date | None
    tags: list[str] = field(default_factory=list)
    body: str = ""


def parse_frontmatter(text: str) -> tuple[dict[str, Any], str]:
    """Split a Markdown file's YAML frontmatter from its body content."""
    match = FRONTMATTER_PATTERN.match(text)
    if not match:
        return {}, text
    raw_frontmatter, body = match.groups()
    metadata = yaml.safe_load(raw_frontmatter) or {}
    return metadata, body.strip()


def load_entry(md_path: Path) -> LogEntry:
    """Read a single Markdown file and convert it into a `LogEntry`."""
    text = md_path.read_text(encoding="utf-8")
    metadata, body = parse_frontmatter(text)

    raw_date = metadata.get("date")
    parsed_date = raw_date if isinstance(raw_date, date) else None

    tags = metadata.get("tags") or []
    if not isinstance(tags, list):
        tags = [tags]

    return LogEntry(path=md_path, date=parsed_date, tags=tags, body=body)


def find_log_files(raw_dir: Path = RAW_DIR) -> list[Path]:
    """Recursively find all `.md` files under the raw logs directory."""
    if not raw_dir.exists():
        return []
    return sorted(raw_dir.rglob("*.md"))


def group_by_chronology(entries: list[LogEntry]) -> list[LogEntry]:
    """Sort entries oldest-to-newest, pushing undated entries to the end."""
    return sorted(entries, key=lambda e: (e.date is None, e.date))


def main() -> None:
    md_files = find_log_files()
    if not md_files:
        print(f"No Markdown files found under {RAW_DIR}")
        return

    entries = [load_entry(path) for path in md_files]
    ordered = group_by_chronology(entries)

    for entry in ordered:
        label = entry.date.isoformat() if entry.date else "UNDATED"
        print(f"[{label}] {entry.path.relative_to(RAW_DIR.parent)} tags={entry.tags}")

    # TODO: hand `ordered` off to the downstream LLM ingestion/embedding pipeline.


if __name__ == "__main__":
    main()
