from pathlib import PurePosixPath


def classify_repository(row: dict, policy: dict) -> list[str]:
    """Return all admission blockers without granting authority from Git state."""
    blockers = []
    path = PurePosixPath(row["path"])
    if any(path.is_relative_to(PurePosixPath(value)) for value in policy.get("excludedPaths", [])):
        blockers.append("excluded")
    slug = row.get("repository")
    owners = {value.lower() for value in policy.get("authorizedOwners", [])}
    repositories = {value.lower() for value in policy.get("authorizedRepositories", [])}
    if not slug or (slug.split("/")[0] not in owners and slug not in repositories):
        blockers.append("not-authorized")
    if row.get("branch") != "main":
        blockers.append("not-main")
    if row.get("dirty"):
        blockers.append("dirty")
    if row["errors"]:
        blockers.append("inspection-error")
    if not row["packages"]:
        blockers.append("no-javascript-packages")
    root_package = next((package for package in row["packages"] if package["path"] == "package.json"), None)
    if root_package and not root_package["manager"]["selected"]:
        blockers.append("ambiguous-manager")
    if not root_package and row["packages"]:
        blockers.append("nested-install-boundary-review")
    if root_package and not root_package["workspaces"] and not root_package["pnpmWorkspace"] and any(
        package["path"] != "package.json" for package in row["packages"]
    ):
        blockers.append("nested-install-boundary-review")
    return blockers
