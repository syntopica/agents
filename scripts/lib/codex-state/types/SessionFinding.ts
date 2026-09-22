export interface SessionFinding {
  path: string
  status: 'ok' | 'malformed'
  sessionId?: string
  summary: string
}
