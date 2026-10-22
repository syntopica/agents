import json
import subprocess
from pathlib import Path


def create_checkout(path: Path, manifest: dict | None = None) -> Path:
    """Create an isolated fixture with a local identity and no network access."""
    path.mkdir(parents=True)
    subprocess.run(["git", "init", "-q", "-b", "main", str(path)], check=True)
    for key, value in {"user.name": "Fixture", "user.email": "fixture@example.invalid", "core.hooksPath": "/dev/null"}.items():
        subprocess.run(["git", "-C", str(path), "config", key, value], check=True)
    subprocess.run(["git", "-C", str(path), "remote", "add", "origin", "https://github.com/example/project.git"], check=True)
    (path / "package.json").write_text(json.dumps(manifest or {"name": "fixture", "packageManager": "pnpm@12.14.0"}))
    (path / "pnpm-lock.yaml").write_text("lockfileVersion: '9.0'\n")
    (path / ".gitignore").write_text("ignored.txt\nnode_modules/\n")
    subprocess.run(["git", "-C", str(path), "add", "package.json", "pnpm-lock.yaml", ".gitignore"], check=True)
    subprocess.run(["git", "-C", str(path), "commit", "-qm", "Fixture"], check=True)
    return path
