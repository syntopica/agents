export type PatchOutcome =
  | { kind: 'applied'; skill: string }
  | { kind: 'already-current'; skill: string }
  | { kind: 'conflict'; skill: string; detail: string }
  | { kind: 'missing-patch'; skill: string; path: string }
