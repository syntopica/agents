export type LinkOutcome =
  | { kind: 'created' }
  | { kind: 'unchanged' }
  | { kind: 'missing'; message: string }
  | { kind: 'foreign'; message: string }
