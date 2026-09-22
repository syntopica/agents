export const validateClaudeTargetSyntax = (document: string): string[] =>
  document.includes('\0') ? ['Claude document contains a NUL byte'] : []
