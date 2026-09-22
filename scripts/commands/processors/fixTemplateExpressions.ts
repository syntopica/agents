import type { SourceFile } from 'ts-morph'
import { SyntaxKind } from 'ts-morph'

export const fixTemplateExpressions = (sf: SourceFile): boolean => {
  let changed = false
  for (const templateSpan of sf.getDescendantsOfKind(SyntaxKind.TemplateSpan)) {
    const expr = templateSpan.getExpression()
    const type = expr.getType()
    if (
      type.isAny() ||
      type.isUnknown() ||
      type.isIntersection() ||
      type.isUnion()
    ) {
      if (
        expr.getKind() === SyntaxKind.Identifier ||
        expr.getKind() === SyntaxKind.PropertyAccessExpression ||
        expr.getKind() === SyntaxKind.ElementAccessExpression ||
        expr.getKind() === SyntaxKind.CallExpression
      ) {
        if (!expr.getText().startsWith('String(')) {
          expr.replaceWithText(`String(${expr.getText()})`)
          changed = true
        }
      }
    }
  }
  return changed
}
