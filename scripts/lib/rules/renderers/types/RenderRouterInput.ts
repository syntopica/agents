import type { RuleItem } from '../../types/RuleItem'

export interface RenderRouterInput {
  getRuleRef: (item: RuleItem) => string
  getRuleBadges: (item: RuleItem) => string[]
  getOneLineDesc: (item: RuleItem) => string
}
