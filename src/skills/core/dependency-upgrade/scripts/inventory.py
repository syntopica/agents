import argparse
import json
from collections import Counter
from pathlib import Path

from classify_repository import classify_repository
from discover_repositories import discover_repositories
from inspect_repository import inspect_repository


def main() -> None:
    """Print an offline inventory; no policy means no authorized checkouts."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--policy", type=Path)
    parser.add_argument("--prune", action="append", default=[])
    arguments = parser.parse_args()
    root = arguments.root.resolve(strict=True)
    policy = json.loads(arguments.policy.read_text()) if arguments.policy else {}
    allowed = {"authorizedOwners", "authorizedRepositories", "excludedPaths"}
    if not isinstance(policy, dict) or set(policy) - allowed or any(
        not isinstance(value, list) or any(not isinstance(item, str) or not item for item in value)
        for value in policy.values()
    ):
        parser.error("Policy must contain only supported arrays of nonempty strings")
    for value in [*arguments.prune, *policy.get("excludedPaths", [])]:
        if Path(value).is_absolute() or ".." in Path(value).parts:
            parser.error("Coverage and exclusion paths must be relative without '..'")
    rows = []
    for repository in discover_repositories(root, arguments.prune):
        row = inspect_repository(repository, root)
        row["blockers"] = classify_repository(row, policy)
        rows.append(row)
    print(json.dumps({
        "schemaVersion": 1, "root": str(root), "prunedPaths": arguments.prune,
        "repositories": rows,
        "summary": dict(Counter(
            blocker for row in rows for blocker in (row["blockers"] or ["ready-for-review"])
        )),
    }, indent=2))


if __name__ == "__main__":
    main()
