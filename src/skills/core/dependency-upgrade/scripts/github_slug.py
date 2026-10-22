import re
from urllib.parse import urlsplit


def github_slug(remote: str) -> str | None:
    """Reduce supported GitHub remotes to a credential-free identity."""
    if remote.startswith("git@github.com:"):
        path = remote.removeprefix("git@github.com:")
    else:
        parsed = urlsplit(remote)
        if parsed.hostname != "github.com" or parsed.scheme not in {"https", "ssh"}:
            return None
        path = parsed.path.lstrip("/")
    path = path.removesuffix(".git")
    return path.lower() if re.fullmatch(r"[\w.-]+/[\w.-]+", path) else None
