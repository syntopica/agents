import type { RouterExpectation } from './types/RouterExpectation'

export const compareRouterExpectationCorpus = (
  phrases: Record<string, string[]>,
  expectations: RouterExpectation[],
): string[] => {
  const measured = new Set(
    Object.entries(phrases).flatMap(([skill, list]) =>
      list.map((phrase) => `${skill}\u0000${phrase}`),
    ),
  )
  const declared = new Set(
    expectations.flatMap((expectation) =>
      expectation.sourceSkills.map(
        (skill) => `${skill}\u0000${expectation.phrase}`,
      ),
    ),
  )
  return [
    ...[...measured]
      .filter((pair) => !declared.has(pair))
      .map((pair) => `missing ${pair}`),
    ...[...declared]
      .filter((pair) => !measured.has(pair))
      .map((pair) => `stale ${pair}`),
  ]
}
