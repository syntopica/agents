export interface ObservationSummary {
  transcripts: number
  skipped: number
  requests: number
  invocations: Record<string, number>
}
