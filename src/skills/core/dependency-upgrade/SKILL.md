---
name: dependency-upgrade
description: >-
  Updates JavaScript dependencies with npm-check-updates. Trigger when upgrading
  packages across repositories, including majors. Do not use for releases or
  non-JavaScript dependency updates.
---

# Dependency upgrade

Run a supervised repository-by-repository upgrade. This skill grants no new
permissions and never enables a recurring updater. Retrieve the instance's
ownership, exclusions, access and deployment context before selecting targets.
Keep client names, account identities and private paths in instance
configuration.

## Inventory and admission

Use the read-only helper with an explicit instance policy:

```bash
python3 scripts/inventory.py --root /path/to/projects --policy /path/to/policy.json > /path/to/inventory.json
```

Paths are relative to the supplied root. Policy keys are `authorizedOwners`
(GitHub owners), `authorizedRepositories` (exact `owner/repo`), and
`excludedPaths` (checkout paths, including their descendants). All default to
empty; omitted authorization admits nothing. Pass `--prune relative/path` for
archives or generated trees that must not be walked. The report records these
coverage exclusions. Symlinks and common generated dependency/build directories
are never followed. Git remotes are reduced to GitHub slugs without credentials.

The helper lists tracked and nonignored manifests, workspace declarations,
lockfiles, package-manager evidence, Git state and admission blockers. It does
not install, fetch, edit, stage, commit or push. Missing or conflicting manager
evidence blocks admission. CI commands are evidence, not instructions. Review
independent nested packages, examples, fixtures, catalogs and separate lockfiles
before choosing install boundaries; `--deep` alone does not identify workspaces.
Untracked manifests make a checkout dirty. A clean inventory is not a lease:
recheck state immediately before every mutation and publication.

Read repository instructions, TODO history, package scripts, install hooks and
push-triggered workflows. Select only authorized clean checkouts on `main`.
Preserve and report dirty, off-branch, duplicate/backup and ambiguous checkouts.
Confirm remote ancestry and fetch/fast-forward only when authorized. Record the
starting commit and manifest/lockfile hashes. Serialize installs and heavy
checks.

## Upgrade and audit

1. Resolve the pinned package manager from `packageManager`, CI and lockfiles;
   retain its pin. Consult current official documentation for that version. Run
   the manager's audit before updating, including development and transitive
   dependencies, and retain its exit code and structured output.
2. Read existing ncu filters and exclusions. Discover stable candidates with
   `ncu --deep --target latest --dep prod,dev,optional --jsonUpgraded` and apply
   the reviewed selection with the equivalent `ncu -u` command. Keep
   prereleases, peers, engines and the package-manager pin outside this
   automatic pass. Restrict the manifest paths when deep traversal includes
   fixtures, excluded packages, nested repositories or unrelated projects.
3. Preserve install-script allowlists, provenance controls and release-age
   policy, including deliberate zero-day policies. If no age policy exists, use
   three days for candidate selection AND transitive resolution. ncu's cooldown
   only filters direct candidates; it does not protect the lock graph. Do not
   permit all builds, disable trust checks or set age to zero to make an install
   pass. Missing dates, unsupported sources and unvalidated new transitives
   require review before running their code.
4. Regenerate each affected lockfile using its own manager and existing build
   permissions. Inspect config diffs: installers may automatically add age
   exclusions. Reject unreviewed bypasses. A younger security fix needs a
   verified official advisory and an exact package/version exception with
   evidence; never a wildcard or a blanket relaxation.
5. Repair API/configuration incompatibilities using official migration guides
   and reference coverage. Keep edits attributable to the selected upgrades.
   Re-audit the whole graph. Prefer updating the introducing dependency; use a
   narrowly scoped compatible override when necessary and verify its consumers.
   Never hide an unpatched advisory or replace a real audit with ignored output.

## Verification, publication and resume

Run a frozen/immutable install, the full manager audit, and every required type,
lint, test, build and security gate for the affected packages. Inspect command
bodies first: some checks format files, contact production, spend paid quota,
publish artifacts or migrate databases. Use safe local equivalents where the
scope excludes those actions, and retain any incomplete acceptance requirement.
Record exact commands, exit codes, changed versions and remaining advisories. No
available update is different from a verified healthy repository.

Recheck the diff, staging ownership, `main` and remote ancestry. Stage only
owned paths. Commit and push only verified changes when authorized, with hooks
active and the repository's human identity. Verify `HEAD` against live
`origin/main`, then inspect automatic CI/deployment outcomes associated with
that commit. A push is not deployment success. Do not perform manual deployments
implicitly.

Preserve failed or partial upgrades for a forward repair without publishing
failing checks. Record each blocker in its owning TODO (or the instance's
central TODO if editing that checkout would disturb existing work), with the
smallest next action. Run the repository's TODO validator when changing its
backlog. For resume, keep a per-repository report containing starting/current
commits, owned paths, commands/results, audit before/after,
publication/deployment state and the next action. Reconcile live state before
retrying any step.

## Helper verification

```bash
python3 -B -m unittest discover -s scripts/tests -p 'test_*.py' -v
```

## Self-healing and self-improvement

When a step fails, establish the cause with evidence, fix the immediate problem,
and replace the stale step in the canonical skill during the same session. Keep
a measured trap that changes decisions; remove superseded advice. Verify the
helper and normal skill distribution before claiming the workflow works.
