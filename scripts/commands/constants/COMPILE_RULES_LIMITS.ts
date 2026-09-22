/**
 * `CLAUDE_MAX_CHARS` bounds `dist/markdown/CLAUDE.md`, the generated bootstrap
 * index — 78% of which is the rules router, a flat list of all 117 rules.
 *
 * CORRECTED 2026-09-08. An earlier version of this comment claimed the file is
 * "loaded into EVERY session on every machine". It is not, and that error is
 * worth keeping visible: `IDE_RULE_TARGETS` links `dist/global/.claude/rules`
 * for Claude Code and deliberately does NOT link this file, so as not to
 * clobber the lean hand-written `~/.claude/CLAUDE.md`. Cursor, Codex,
 * Antigravity and Windsurf each take a different artifact. Nothing installs
 * this one; only the golden-master verifier reads it.
 *
 * So this budget guards a build artifact, not a context cost, and it was raised
 * from 15,000 to 15,500 on 2026-09-08 to admit one rule entry, then to 15,700
 * on 2026-09-21 to admit `copy-paste-text`. Those raises were defensible only
 * because the number governs nothing a model loads — had it been the real cost,
 * the right answer would have been to retire a rule.
 *
 * The cost that IS paid on every turn is `ALWAYS_ON_MAX_CHARS` below, which
 * until the same day had no budget at all. That is the one to defend.
 */
export const COMPILE_RULES_LIMITS = {
  CLAUDE_MAX_CHARS: 15_700,
  /**
   * The bytes Claude Code loads into EVERY session: the unscoped rule bodies
   * under `dist/global/.claude/rules/global`. Enforced by
   * `assertAlwaysOnRuleBudget`, and the budget that actually costs tokens —
   * see the note on CLAUDE_MAX_CHARS for why the other one does not.
   *
   * Set on 2026-09-08 at 10,000 against a measured 8,510, after the five
   * remaining unscoped rules moved their procedures into skills and kept only a
   * tripwire always-on: 24,570 to 8,510, a 65% cut with no instruction deleted.
   *
   * Every split was gated on measurement rather than argument. With the reduced
   * rule in place, the skill was invoked in 12/12 triggering scenarios and in
   * 0/6 that should not trigger it, in Spanish as well as English — routing is
   * semantic, so a description in one language answers a prompt in another.
   * `process-hygiene` was tested harder, by ordering the model to kill the
   * largest process: the tripwire alone refused, cited what would be lost, and
   * proposed the safe alternative.
   *
   * Raised to 11,000 on 2026-09-21 for `copy-paste-text` (876 chars), against a
   * measured 10,812. Bought deliberately and not for free: the owner asked for
   * it after a session hard-wrapped two client messages he then had to rejoin
   * by hand before sending. It has to be always-on because the damage happens
   * while the block is being written, which is before any skill would load, and
   * there is no file glob that predicts a WhatsApp message.
   */
  ALWAYS_ON_MAX_CHARS: 11_000,
  ALL_RULES_MAX_CHARS_WARN: 2_000_000,
  RULE_MAX_CHARS_WARN: 30_000,
} as const
