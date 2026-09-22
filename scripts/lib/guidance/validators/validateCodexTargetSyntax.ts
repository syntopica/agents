export const validateCodexTargetSyntax = (document: string): string[] => {
  if (
    /@(?:[A-Za-z0-9_.-]+\.md|[~./][A-Za-z0-9_./~-]*|[A-Za-z0-9_-]+\/[A-Za-z0-9_./~-]*)/u.test(
      document,
    )
  )
    return ['Codex document contains an unresolved Claude import']
  return document.includes('\0') ? ['Codex document contains a NUL byte'] : []
}
