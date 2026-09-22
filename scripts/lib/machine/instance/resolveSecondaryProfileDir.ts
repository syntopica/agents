/**
 * Directory name, under `$HOME`, of the second Claude Code profile.
 *
 * This is instance data, not engine data. The name of the account the second
 * profile belongs to is nobody else's business, and hard-coding it here is
 * what kept this repository private until 2026-09-18: one constant put an
 * employer's name into 61 tracked files. A machine declares the directory it
 * actually has through `CLAUDE_SECONDARY_CONFIG_DIR`, the same way it declares
 * its manifests through `AGENTS_MACHINE_DIR`; the default names nobody.
 */
export const resolveSecondaryProfileDir = (env: NodeJS.ProcessEnv): string =>
  env['CLAUDE_SECONDARY_CONFIG_DIR'] ?? '.claude-secondary'
