from pathlib import Path
from subprocess import TimeoutExpired

from github_slug import github_slug
from inspect_manifest import inspect_manifest
from read_git import read_git


def inspect_repository(repository: Path, root: Path) -> dict:
    """Collect Git state and manifests, retaining query and parse failures."""
    row = {"path": str(repository.relative_to(root)), "packages": [], "errors": []}
    try:
        row["branch"] = read_git(repository, "branch", "--show-current")
        row["head"] = read_git(repository, "rev-parse", "HEAD")
        row["dirty"] = bool(read_git(
            repository, "status", "--porcelain=v1", "--untracked-files=all"
        ))
        try:
            row["repository"] = github_slug(read_git(repository, "remote", "get-url", "origin"))
        except ValueError:
            row["repository"] = None
        files = read_git(
            repository, "ls-files", "-z", "--cached", "--others", "--exclude-standard"
        ).split("\0")
        ci = "\n".join(
            (repository / name).read_text() for name in files
            if name.startswith(".github/workflows/")
            and name.endswith((".yml", ".yaml"))
            and (repository / name).is_file()
            and not (repository / name).is_symlink()
        )
        for name in sorted(set(files)):
            if name != "package.json" and not name.endswith("/package.json"):
                continue
            if any(part in {"node_modules", "vendor", ".git"} for part in Path(name).parts):
                continue
            try:
                if Path(read_git(repository / Path(name).parent, "rev-parse", "--show-toplevel")).resolve() != repository.resolve():
                    continue
                row["packages"].append(inspect_manifest(repository, name, ci))
            except (OSError, ValueError, TimeoutExpired) as error:
                row["errors"].append(f"{name}: {type(error).__name__}")
    except (OSError, ValueError, TimeoutExpired) as error:
        row["errors"].append(type(error).__name__)
    return row
