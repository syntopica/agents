export interface LiveServer {
  command?: string
  args?: string[]
  url?: string
  type?: string
  startup_timeout_sec?: number
  required?: boolean
  default_tools_approval_mode?: string
  env: Record<string, unknown>
  headers: Record<string, unknown>
  headerReferences: Record<string, string>
}
