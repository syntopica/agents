import json
from pathlib import Path

from detect_manager import detect_manager


def inspect_manifest(repository: Path, relative: str, ci: str) -> dict:
    """Describe an on-disk package without interpreting executable config."""
    path = repository / relative
    if path.is_symlink() or not path.resolve().is_relative_to(repository.resolve()):
        raise ValueError(f"Manifest escapes checkout: {relative}")
    manifest = json.loads(path.read_text())
    return {
        "path": relative,
        "name": manifest.get("name"),
        "manager": detect_manager(path.parent, manifest, ci),
        "scripts": sorted(manifest.get("scripts", {})),
        "workspaces": manifest.get("workspaces"),
        "pnpmWorkspace": (path.parent / "pnpm-workspace.yaml").is_file(),
        "dependencyCount": sum(len(manifest.get(field, {})) for field in (
            "dependencies", "devDependencies", "optionalDependencies"
        )),
    }
