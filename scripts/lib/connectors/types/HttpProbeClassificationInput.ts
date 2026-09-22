export interface HttpProbeClassificationInput {
  httpCode: number
  body: string
  retryAfter: string | null
  durationMs: number
}
