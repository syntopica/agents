import { ATOMIC_FILE_RULE_SLIM } from '../constants/ATOMIC_FILE_RULE_SLIM'
import { CLAUDE_HEADER_INTRO } from '../constants/CLAUDE_HEADER_INTRO'
import type { RenderClaudeOptions } from '../types/RenderClaudeOptions'
import type { RuleItem } from '../types/RuleItem'
import { renderIndexOnly } from './renderIndexOnly'

/**
 * Index-only bootstrap renderer for CLAUDE.md.
 * Thin wrapper around renderIndexOnly with CLAUDE-specific header and options.
 *
 * The Atomic File Rule is embedded in a slim form (≤25 lines) directly in
 * Tier 0 so it stays always-on. The full rule (banned-patterns table,
 * ts-morph example, self-check checklist) lives in
 * `@rules/core/code-structure.mdc` and is loaded on demand.
 *
 * @param {Array<{ rel: string, frontmatter: unknown, content: string }>} bundle
 * @param {{ maxChars?: number, includeShortSummary?: boolean }=} options
 * @returns {string}
 */

export function renderClaudeIndexOnly(
  bundle: RuleItem[],
  options: RenderClaudeOptions = {},
) {
  const maxChars =
    typeof options.maxChars === 'number' ? options.maxChars : 15_000

  return renderIndexOnly(bundle, {
    format: 'claude',
    title: '# CLAUDE.md',
    headerIntro: CLAUDE_HEADER_INTRO,

    embedContent: ATOMIC_FILE_RULE_SLIM,

    maxChars,
    includeShortSummary: options.includeShortSummary === true,
    referencePrefix: '@rules/',
    onLimit: 'error',
  })
}
