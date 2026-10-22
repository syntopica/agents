import re
from pathlib import Path


def detect_manager(directory: Path, manifest: dict, ci: str) -> dict:
    """Select a manager only when manifest, CI and lock evidence agree."""
    lock_managers = {
        "pnpm-lock.yaml": "pnpm", "package-lock.json": "npm",
        "npm-shrinkwrap.json": "npm", "yarn.lock": "yarn",
        "bun.lock": "bun", "bun.lockb": "bun",
    }
    locks = [name for name in lock_managers if (directory / name).is_file()]
    declared = manifest.get("packageManager", "")
    declared_manager = declared.split("@")[0]
    ci_managers = sorted(set(re.findall(
        r"\b(pnpm|npm|yarn|bun)\s+(?:install|ci)\b", ci
    )))
    evidence = set(ci_managers)
    if declared_manager:
        evidence.add(declared_manager)
    if not evidence:
        evidence.update(lock_managers[name] for name in locks)
    selected = next(iter(evidence)) if len(evidence) == 1 else None
    if selected not in set(lock_managers.values()):
        selected = None
    return {
        "selected": selected, "declared": declared or None,
        "ci": ci_managers, "lockfiles": locks,
        "reason": "resolved" if selected else "missing-or-conflicting-evidence",
    }
