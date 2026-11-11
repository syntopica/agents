/**
 * Distinctive substring each router lane must inject. Matching on a marker keeps
 * the test tied to which skill is summoned rather than to exact wording.
 */
export const LANE_MARKERS: Record<string, string> = {
  'invoice-ops': 'Invoice and tax work',
  debug: 'systematic-debugging',
  frontend: 'frontend-design',
  continuation: 'Resuming earlier work',
  'stakeholder-recap': 'Stakeholder-comms',
  'lovable-sync': 'Lovable design sync',
  'traffic-client': 'brp-traffic-client',
  'contract-ops': 'Contract production',
  'agent-config': 'Agent-configuration work',
  'environment-ops': 'Environment/host work',
  'repo-modernization': 'Repo modernization',
  loop: '/loop',
  plan: 'superpowers:brainstorming',
  docs: 'brp-docs',
  release: 'brp-release',
}
