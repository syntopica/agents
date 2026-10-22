import os
import subprocess
from pathlib import Path


def read_git(repository: Path, *arguments: str) -> str:
    """Run an internal read-only Git query without optional index writes."""
    result = subprocess.run(
        ["git", "-C", str(repository), *arguments],
        capture_output=True,
        text=True,
        check=False,
        timeout=30,
        env={**os.environ, "GIT_OPTIONAL_LOCKS": "0", "GIT_TERMINAL_PROMPT": "0"},
    )
    if result.returncode:
        raise ValueError(f"Git query failed: {arguments[0]}")
    return result.stdout.rstrip("\n")
