export interface GuidancePolicy {
  version: 1
  requiredInvariants: string[]
  officialDocumentationOrigins: { claude: string[]; codex: string[] }
  maxOutputBytes: number
  agentCommand: string[]
  agentReadAllowlist?: string[]
  agentBootstrapFiles?: string[]
  timeoutMs: number
}
