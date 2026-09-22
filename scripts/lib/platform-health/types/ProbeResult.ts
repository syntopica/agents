export interface ProbeResult {
  kind: 'command' | 'app' | 'config'
  candidate: string
  found: boolean
  resolvedPath?: string
}
