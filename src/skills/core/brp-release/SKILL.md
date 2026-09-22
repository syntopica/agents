---
name: brp-release
description:
  Cuts a versioned release from trunk with the commits since the last tag, the
  semver bump, the changelog, a green check gate, and the tag. Trigger when the
  task is to ship a release, bump a version, or generate release notes/changelog
  for a repo. Do not use for writing the feature itself, debugging, or general
  code review unrelated to shipping.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

## Rules

- Never tag a release while lint, build, or tests are failing. The green check
  gates the tag.
- Derive the changelog from real commits since the last tag. Do not invent or
  pad entries.
- Pick the semver bump from the actual change scope: breaking -> major, feature
  -> minor, fix only -> patch.
- One immutable tag per release. Never move, delete, or reuse an existing tag.
  If the computed tag name already exists, stop and report instead of
  auto-incrementing past it.
- When the release publishes a package to a registry, run `npm pack --dry-run`
  (or the package manager's equivalent) first and read the file list: source
  maps with `sourcesContent`, env files, or private docs in the tarball block
  the publish until excluded. A published tarball ships whatever the file list
  shows, permanently.

## Workflow

1. Confirm a clean working tree on trunk; stop and report if either fails.
2. Find the last release tag and collect the commits made since it.
3. Classify the changes (breaking, feature, fix) and choose the semver bump.
4. Update the version field(s) and changelog from those commits. If the
   changelog carries an `## [Unreleased]` section, fold it into the new
   version's entry instead of re-deriving what it already records; commits since
   the tag fill only the gaps.
5. Run the full check (lint, build, tests). Stop and report if anything fails.
6. Tag the release, push trunk and the tag to the remote
   (`git push origin <trunk> --tags`), and report version, changelog, and what
   was published. A tag that never reaches the remote ships nothing.
7. Open the next cycle: when the repo keeps a changelog, leave a fresh empty
   `## [Unreleased]` heading at the top so development entries land there as
   they ship, and the next release starts from a current changelog rather than
   from archaeology.

## Output

- Return: version bump and reasoning, changelog entry, tag name, check result,
  anything skipped.
