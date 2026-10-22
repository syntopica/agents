import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from classify_repository import classify_repository
from create_checkout import create_checkout
from detect_manager import detect_manager
from discover_repositories import discover_repositories
from github_slug import github_slug
from inspect_repository import inspect_repository
from read_git import read_git
from raise_walk_error import raise_walk_error


class InventoryTests(unittest.TestCase):
    def test_traversal_errors_are_not_silenced(self) -> None:
        with self.assertRaises(PermissionError):
            raise_walk_error(PermissionError("fixture"))

    def test_nested_repositories_and_workspaces(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            parent = create_checkout(root / "parent")
            nested = create_checkout(parent / "nested")
            (parent / "packages" / "child").mkdir(parents=True)
            (parent / "packages" / "child" / "package.json").write_text('{"name":"child"}')
            (parent / "pnpm-workspace.yaml").write_text("packages:\n  - packages/*\n")
            self.assertEqual(discover_repositories(root, []), [parent, nested])
            row = inspect_repository(parent, root)
            self.assertEqual([p["path"] for p in row["packages"]], ["package.json", "packages/child/package.json"])
            self.assertTrue(row["packages"][0]["pnpmWorkspace"])

    def test_dirty_and_excluded_are_preserved(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            repository = create_checkout(root / "checkout")
            (repository / "package.json").write_text('{"name":"modified","packageManager":"pnpm@12"}')
            (repository / "untracked.txt").write_text("keep")
            (repository / "ignored.txt").write_text("also keep")
            before = {p: p.read_bytes() for p in repository.rglob("*") if p.is_file()}
            row = inspect_repository(repository, root)
            blockers = classify_repository(row, {"authorizedOwners": ["example"], "excludedPaths": ["checkout"]})
            self.assertEqual(blockers, ["excluded", "dirty"])
            self.assertEqual(before, {p: p.read_bytes() for p in repository.rglob("*") if p.is_file()})

    def test_ambiguous_locks_fail_closed(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            (directory / "package-lock.json").write_text("{}")
            (directory / "yarn.lock").write_text("")
            self.assertIsNone(detect_manager(directory, {}, "")["selected"])
            self.assertEqual(detect_manager(directory, {"packageManager": "npm@12"}, "")["selected"], "npm")
            self.assertIsNone(detect_manager(directory, {"packageManager": "npm@12"}, "pnpm install --frozen-lockfile")["selected"])

    def test_authorization_requires_exact_owner_or_slug(self) -> None:
        row = {"path": "project", "repository": "example/project", "branch": "main", "dirty": False, "errors": [], "packages": []}
        self.assertIn("not-authorized", classify_repository(row, {}))
        self.assertNotIn("not-authorized", classify_repository(row, {"authorizedRepositories": ["EXAMPLE/project"]}))
        self.assertIn("not-authorized", classify_repository(row, {"authorizedOwners": ["exam"]}))

    def test_non_main_and_invalid_manifest(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            repository = create_checkout(root / "checkout")
            subprocess.run(["git", "-C", str(repository), "switch", "-qc", "other"], check=True)
            (repository / "package.json").write_text("{")
            row = inspect_repository(repository, root)
            self.assertTrue(row["errors"])
            self.assertIn("not-main", classify_repository(row, {"authorizedOwners": ["example"]}))

    def test_symlinks_dependencies_and_explicit_prunes(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            repository = create_checkout(root / "checkout")
            create_checkout(root / "archive" / "copy")
            create_checkout(repository / "node_modules" / "dependency")
            (root / "alias").symlink_to(repository, target_is_directory=True)
            self.assertEqual(discover_repositories(root, ["archive"]), [repository])

    def test_remote_credentials_never_reach_report(self) -> None:
        self.assertEqual(github_slug("https://user:fixture-password@github.com/Example/Project.git"), "example/project")
        self.assertEqual(github_slug("git@github.com:Example/Project.git"), "example/project")
        self.assertIsNone(github_slug("https://github.com.attacker.invalid/example/project.git"))

    def test_cli_has_no_authority_without_policy(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            repository = create_checkout(root / "checkout")
            before = read_git(repository, "status", "--porcelain=v1")
            result = subprocess.run([sys.executable, "-B", str(Path(__file__).resolve().parents[1] / "inventory.py"), "--root", str(root)], check=True, capture_output=True, text=True)
            report = json.loads(result.stdout)
            self.assertIn("not-authorized", report["repositories"][0]["blockers"])
            self.assertEqual(before, read_git(repository, "status", "--porcelain=v1"))
