/**
 * Rewrites portable `@rules/cat/foo.mdc` references to
 * Antigravity-native `@.agent/rules/cat-foo.md` format.
 *
 * Antigravity resolves `@.agent/rules/` from the global install
 * (`~/.gemini/.agent/rules/`). The portable `@rules/` format is
 * not recognized and causes "Cannot list .agents/rule" errors.
 */
export const rewriteAntigravityRuleRefs = (content: string): string =>
  content.replace(
    /@rules\/([^/\s]+)\/([^\s]+?)\.mdc/g,
    (_match: string, cat: string, name: string) =>
      `@.agent/rules/${cat}-${name}.md`,
  )
