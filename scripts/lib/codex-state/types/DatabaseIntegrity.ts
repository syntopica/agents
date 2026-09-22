export interface DatabaseIntegrity {
  path: string
  status: 'ok' | 'corrupt' | 'missing' | 'unreadable'
  summary: string
}
