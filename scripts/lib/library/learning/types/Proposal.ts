export interface Proposal {
  kind: 'promote' | 'fix-trigger' | 'build' | 'park'
  skill?: string
  procedure?: string
  requests: number
  why: string
}
