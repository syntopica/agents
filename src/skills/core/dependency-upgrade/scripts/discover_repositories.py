import os
from pathlib import Path

from raise_walk_error import raise_walk_error


def discover_repositories(root: Path, prune: list[str]) -> list[Path]:
    """Find nested checkouts without entering dependencies or following links."""
    skipped = {
        ".git", "node_modules", ".venv", ".venv-validate", "venv", "vendor",
        ".next", ".nuxt", "dist", "build", "target", ".cache", "__pycache__",
    }
    excluded = [root / name for name in prune]
    repositories = []
    for directory, children, _ in os.walk(root, followlinks=False, onerror=raise_walk_error):
        current = Path(directory)
        if (current / ".git").exists():
            repositories.append(current)
        children[:] = sorted(
            name for name in children
            if name not in skipped
            and not (current / name).is_symlink()
            and not any((current / name).is_relative_to(path) for path in excluded)
        )
    return repositories
