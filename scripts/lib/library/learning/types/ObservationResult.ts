import type { ObservationSummary } from './ObservationSummary'
import type { ObservedTurn } from './ObservedTurn'

export interface ObservationResult {
  summary: ObservationSummary
  turns: ObservedTurn[]
  sequence: ObservedTurn[]
  index: Record<string, number>
}
