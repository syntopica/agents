import { createKnipConfig } from '@syntopica/quality-config/knip'
import type { KnipConfiguration } from 'knip'

const baseline = createKnipConfig({
  framework: 'ts-package',
}) as KnipConfiguration

const config: KnipConfiguration = {
  ...baseline,
  // Most of this repo is tooling run by hand or by package scripts, not a
  // library entry: without these, everything under scripts/ reads as dead and
  // the packages only they use -- ajv, ajv-formats -- read as unused
  // dependencies.
  // Entry points are the CLIs the package scripts invoke -- 63 files across
  // bin/ and commands/ -- plus the *_TEST.ts verifiers and the fixtures they
  // read. Narrowing entry to bin/ and commands/ alone reported 298 files as
  // dead, because the verifiers reach the rest; widening it to all of
  // scripts/** hid 47 genuinely unreferenced exports by making every helper
  // its own root. This is the middle, and it is the one that matches how the
  // repo is actually run. `scripts/golden/` and `machine/` were listed here
  // too until 2026-08-31 and hold no TypeScript at all -- fixtures and JSON
  // manifests -- so knip reported both globs as matching nothing.
  entry: [
    ...(baseline.entry as string[]),
    'scripts/bin/**/*.{ts,mts,mjs}',
    'scripts/commands/**/*.{ts,mts,mjs}',
    'scripts/**/*_TEST.{ts,mts}',
  ],
  project: [...(baseline.project as string[]), 'scripts/**/*.{ts,mts,mjs}'],
  // System tools the scripts shell out to, not packages: installed by
  // Homebrew, pipx or a global npm, and knip cannot resolve any of them. Only
  // the ones knip really cannot resolve belong here -- an entry for a binary
  // it can resolve becomes a permanent "Remove from ignoreBinaries" hint, and
  // codex, claude, gemini, antigravity, uvx, jq, rg and shellcheck were all
  // reported as exactly that.
  ignoreBinaries: ['gitleaks', 'skillkit', 'pipx', 'skills-ref', 'sqlite3'],
}

export default config
