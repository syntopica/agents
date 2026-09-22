export type RouterExpectation = {
  phrase: string
  sourceSkills: string[]
  reason: string
} & (
  | { expectedLane: string; intentionalSilence?: never }
  | { expectedLane?: never; intentionalSilence: true }
)
