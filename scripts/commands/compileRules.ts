/* eslint-disable sonarjs/cognitive-complexity */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { listFilesRecursive } from '../lib/fs/operations/listFilesRecursive'
import { readIfExists } from '../lib/fs/operations/readIfExists'
import { checkAntigravityRules } from '../lib/rules/checkers/checkAntigravityRules'
import { checkClaudeRules } from '../lib/rules/checkers/checkClaudeRules'
import { checkCursorRules } from '../lib/rules/checkers/checkCursorRules'
import { checkWindsurfRules } from '../lib/rules/checkers/checkWindsurfRules'
import { generateBundle } from '../lib/rules/generators/generateBundle'
import { renderAgents } from '../lib/rules/renderers/renderAgents'
import { renderAllRules } from '../lib/rules/renderers/renderAllRules'
import { renderAntigravity } from '../lib/rules/renderers/renderAntigravity'
import { renderClaudeIndexOnly } from '../lib/rules/renderers/renderClaudeIndexOnly'
import { renderCodexDefaultRules } from '../lib/rules/renderers/renderCodexDefaultRules'
import { renderWindsurf } from '../lib/rules/renderers/renderWindsurf'
import { syncAntigravityRules } from '../lib/rules/syncers/syncAntigravityRules'
import { syncClaudeRules } from '../lib/rules/syncers/syncClaudeRules'
import { syncCursorRules } from '../lib/rules/syncers/syncCursorRules'
import { syncWindsurfRules } from '../lib/rules/syncers/syncWindsurfRules'
import { assertAlwaysOnRuleBudget } from './assertAlwaysOnRuleBudget'
import { COMPILE_RULES_LIMITS } from './constants/COMPILE_RULES_LIMITS'
import { COMPILE_RULES_PATHS } from './constants/COMPILE_RULES_PATHS'

export const main = async () => {
  // When RULES_INDEX_ONLY=0, legacy full-content could be used; currently index-only is the only path.
  const RULES_INDEX_ONLY = process.env['RULES_INDEX_ONLY'] !== '0'

  if (!RULES_INDEX_ONLY) {
    console.warn(
      '[rules] RULES_INDEX_ONLY=0: index-only is still used (legacy path not implemented).',
    )
  }
  const checkOnly = process.argv.includes('--check')

  const p = COMPILE_RULES_PATHS
  const l = COMPILE_RULES_LIMITS

  let sourceFiles: string[] = []
  try {
    sourceFiles = await listFilesRecursive(p.SOURCE_DIR)
  } catch {
    console.error('Missing rules source directory: /rules')
    process.exit(1)
  }

  const bundle = await generateBundle(sourceFiles, p.SOURCE_DIR)

  for (const item of bundle) {
    const bodyLen = item.content.length
    if (bodyLen > l.RULE_MAX_CHARS_WARN) {
      console.warn(
        `[rules] Large rule body: ${item.rel} (${String(bodyLen)} chars) > ${String(l.RULE_MAX_CHARS_WARN)}. Consider splitting.`,
      )
    }
  }

  const nextClaude = renderClaudeIndexOnly(bundle, {
    maxChars: l.CLAUDE_MAX_CHARS,
    includeShortSummary: false,
  })

  const nextAgents = renderAgents(bundle)
  const nextGemini = renderAntigravity(bundle)
  const nextWindsurf = renderWindsurf(bundle)
  const nextAllRules = renderAllRules(bundle)
  const nextCodexDefaultRules = renderCodexDefaultRules()

  if (checkOnly) {
    const errors: string[] = [
      ...(await checkCursorRules(sourceFiles, p.SOURCE_DIR, p.CURSOR_DIR)),
      ...(await checkClaudeRules(
        sourceFiles,
        p.SOURCE_DIR,
        p.CLAUDE_RULES_DIR,
      )),
      ...(await checkAntigravityRules(
        sourceFiles,
        p.SOURCE_DIR,
        p.ANTIGRAVITY_DIR,
      )),
      ...(await checkWindsurfRules(sourceFiles, p.SOURCE_DIR, p.WINDSURF_DIR)),
    ]

    const currentClaude = await readIfExists(p.CLAUDE_PATH)
    const currentAgents = await readIfExists(p.AGENTS_PATH)
    const currentGemini = await readIfExists(p.GEMINI_PATH)
    const currentWindsurf = await readIfExists(p.WINDSURF_PATH)

    if (currentClaude !== nextClaude)
      errors.push('Outdated generated file: CLAUDE.md')
    if (currentAgents !== nextAgents)
      errors.push('Outdated generated file: AGENTS.md')
    if (currentGemini !== nextGemini)
      errors.push('Outdated generated file: GEMINI.md')
    if (currentWindsurf !== nextWindsurf)
      errors.push('Outdated generated file: WINDSURF.md')

    const currentAllRules = await readIfExists(p.ALL_RULES_PATH)
    if (currentAllRules !== nextAllRules)
      errors.push('Outdated generated file: ALL_RULES.md')

    const currentCodexDefaultRules = await readIfExists(
      p.CODEX_DEFAULT_RULES_PATH,
    )
    if (currentCodexDefaultRules !== nextCodexDefaultRules)
      errors.push('Outdated generated file: codex/rules/default.rules')

    if (errors.length > 0) {
      console.error('Rules are not compiled or are out of date:\n')
      for (const error of errors) {
        console.error(`- ${error}`)
      }
      process.exit(1)
    }

    console.log('Rules are up to date.')
    return
  }

  await syncCursorRules(sourceFiles, p.SOURCE_DIR, p.CURSOR_DIR)
  await syncClaudeRules(sourceFiles, p.SOURCE_DIR, p.CLAUDE_RULES_DIR)
  await syncAntigravityRules(sourceFiles, p.SOURCE_DIR, p.ANTIGRAVITY_DIR)
  await syncWindsurfRules(sourceFiles, p.SOURCE_DIR, p.WINDSURF_DIR)

  await fs.mkdir(p.CODEX_RULES_DIR, { recursive: true })
  await fs.writeFile(p.CODEX_DEFAULT_RULES_PATH, nextCodexDefaultRules, 'utf8')
  await fs.mkdir(path.dirname(p.CLAUDE_PATH), { recursive: true })
  await fs.writeFile(p.CLAUDE_PATH, nextClaude, 'utf8')
  await fs.writeFile(p.AGENTS_PATH, nextAgents, 'utf8')
  await fs.writeFile(p.GEMINI_PATH, nextGemini, 'utf8')
  await fs.writeFile(p.WINDSURF_PATH, nextWindsurf, 'utf8')
  await fs.writeFile(p.ALL_RULES_PATH, nextAllRules, 'utf8')

  await assertAlwaysOnRuleBudget(p.CLAUDE_RULES_DIR)

  if (nextAllRules.length > l.ALL_RULES_MAX_CHARS_WARN) {
    console.warn(
      `[rules] ALL_RULES.md is large (${String(nextAllRules.length)} chars > ${String(l.ALL_RULES_MAX_CHARS_WARN)}). Consider splitting or excluding heavy rules.`,
    )
  }

  console.log(
    `Wrote CLAUDE.md bootstrap (${String(nextClaude.length)} chars) -> ${p.CLAUDE_PATH}`,
  )
  console.log(
    `Wrote dist/markdown/ALL_RULES.md (${String(nextAllRules.length)} chars)`,
  )
  console.log(
    'Compiled rules for Cursor, Claude, Codex, Antigravity (Gemini), and Windsurf.',
  )
}
