export interface StdioMcpProbeResult {
  status: 'healthy' | 'failed'
  boundary: 'client'
  durationMs: number
  summary: string
}
