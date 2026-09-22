import { normalizeRel } from '../converters/normalizeRel'
import type { RuleItem } from '../types/RuleItem'

export function defaultGetRuleRef(prefix: string) {
  return (rule: RuleItem) => `${prefix}${normalizeRel(rule.rel)}`
}
