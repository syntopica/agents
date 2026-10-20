export interface InspectSecurityCredentialNodeResult {
  findings: string[]
  children: { path: string; value: unknown }[]
}
