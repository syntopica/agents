export interface RouterOutcome {
  skill: string
  phrase: string
  lane?: string
  expectedLane?: string
  intentionalSilence?: true
  verdict: 'correct-lane' | 'wrong-lane' | 'no-lane'
}
