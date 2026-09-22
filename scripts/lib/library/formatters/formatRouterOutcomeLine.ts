import type { RouterOutcome } from '../learning/types/RouterOutcome'

export const formatRouterOutcomeLine = (outcome: RouterOutcome) => {
  const where =
    outcome.verdict === 'no-lane' ? 'silent' : `-> ${outcome.lane ?? ''}`

  return `  ${where} [${outcome.skill}] ${outcome.phrase.slice(0, 88)}`
}
