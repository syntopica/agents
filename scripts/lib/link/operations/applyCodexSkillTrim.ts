import { CODEX_SKILL_TRIM_MARKERS } from '../constants/CODEX_SKILL_TRIM_MARKERS'

/**
 * Puts `block` into `config`, replacing an existing generated block or
 * appending one when there is none.
 *
 * A pure string transform on purpose: it decides what the file becomes, and the
 * caller decides whether to write it. Everything outside the markers is carried
 * through untouched, including a partial fence - a start without an end leaves
 * the file alone rather than swallowing the rest of the configuration. The end
 * is the first one after the start: an orphaned end earlier in the file once
 * made every run append a fresh block instead of replacing the fenced one.
 */
export const applyCodexSkillTrim = (config: string, block: string) => {
  const start = config.indexOf(CODEX_SKILL_TRIM_MARKERS.start)
  const end =
    start === -1 ? -1 : config.indexOf(CODEX_SKILL_TRIM_MARKERS.end, start)

  if (start === -1 || end === -1) {
    const head = config.trimEnd()
    return head === '' ? `${block}\n` : `${head}\n\n${block}\n`
  }

  return (
    config.slice(0, start) +
    block +
    config.slice(end + CODEX_SKILL_TRIM_MARKERS.end.length)
  )
}
