import type { ForcedLoginMethodResult } from './types/ForcedLoginMethodResult'

export const ensureForcedLoginMethod = (
  contents: string,
): ForcedLoginMethodResult => {
  const lines = contents.split('\n')
  const assignmentPattern =
    /^(\s*forced_login_method\s*=\s*)"([^"]*)"(\s*(?:#.*)?)$/
  const assignmentIndexes = lines.flatMap((line, index) =>
    assignmentPattern.test(line) ? [index] : [],
  )
  if (assignmentIndexes.length > 1) {
    return {
      ok: false,
      errors: ['forced_login_method must appear at most once'],
    }
  }

  const assignmentIndex = assignmentIndexes[0]
  if (assignmentIndex !== undefined) {
    const hasTableBefore = lines
      .slice(0, assignmentIndex)
      .some((line) => line.trimStart().startsWith('['))
    if (hasTableBefore) {
      return {
        ok: false,
        errors: ['forced_login_method must be a top-level setting'],
      }
    }
    const assignmentLine = lines[assignmentIndex]
    if (assignmentLine === undefined) {
      return { ok: false, errors: ['forced_login_method is malformed'] }
    }
    const match = assignmentPattern.exec(assignmentLine)
    if (match === null)
      return { ok: false, errors: ['forced_login_method is malformed'] }
    if (match[2] === 'chatgpt') return { ok: true, contents, changed: false }
    const prefix = match[1] ?? ''
    const suffix = match[3] ?? ''
    lines[assignmentIndex] = `${prefix}"chatgpt"${suffix}`
    return { ok: true, contents: lines.join('\n'), changed: true }
  }

  let insertionIndex = lines.findIndex((line) =>
    line.trimStart().startsWith('['),
  )
  if (insertionIndex === -1) insertionIndex = lines.length
  while (insertionIndex > 0 && lines[insertionIndex - 1]?.trim() === '')
    insertionIndex -= 1
  lines.splice(insertionIndex, 0, 'forced_login_method = "chatgpt"')
  return { ok: true, contents: lines.join('\n'), changed: true }
}
