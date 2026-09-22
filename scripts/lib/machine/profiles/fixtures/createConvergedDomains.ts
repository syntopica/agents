import type { DomainResult } from '../../types/DomainResult'

export const createConvergedDomains = (): DomainResult[] =>
  ['mcp', 'security', 'capabilities', 'plugins', 'services'].map((domain) => ({
    domain,
    status: 'converged',
    changes: 0,
    messages: [],
  }))
