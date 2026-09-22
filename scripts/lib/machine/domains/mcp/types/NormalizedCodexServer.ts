export interface NormalizedCodexServer {
  command?: string
  args?: string[]
  url?: string
  startup_timeout_sec?: number
  required?: boolean
  default_tools_approval_mode?: string
  http_headers?: Record<string, string>
  env_http_headers?: Record<string, string>
}
