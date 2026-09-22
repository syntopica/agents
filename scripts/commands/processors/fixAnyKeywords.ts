import type { SourceFile } from 'ts-morph'
import { SyntaxKind } from 'ts-morph'

export const fixAnyKeywords = (sf: SourceFile): boolean => {
  let changed = false
  for (const anyKw of sf.getDescendantsOfKind(SyntaxKind.AnyKeyword)) {
    anyKw.replaceWithText('unknown')
    changed = true
  }
  return changed
}
