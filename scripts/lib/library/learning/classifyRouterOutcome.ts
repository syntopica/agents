import type { RouterExpectation } from '../../hooks/types/RouterExpectation'
import { LANE_SKILLS } from './constants/LANE_SKILLS'
import type { RouterOutcome } from './types/RouterOutcome'

export const classifyRouterOutcome = (
  skill: string,
  lane: string | undefined,
  expectation?: RouterExpectation,
): RouterOutcome['verdict'] => {
  if (expectation?.intentionalSilence === true) {
    return lane === undefined ? 'no-lane' : 'wrong-lane'
  }
  if (expectation?.expectedLane !== undefined) {
    if (lane === undefined) return 'no-lane'
    return lane === expectation.expectedLane ? 'correct-lane' : 'wrong-lane'
  }
  if (lane === undefined) {
    return 'no-lane'
  }

  const owned = LANE_SKILLS[lane] ?? []

  return owned === 'policy-only' || !owned.includes(skill)
    ? 'wrong-lane'
    : 'correct-lane'
}
