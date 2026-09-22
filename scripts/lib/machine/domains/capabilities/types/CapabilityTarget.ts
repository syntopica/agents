export interface CapabilityTarget {
  id: string
  capability: 'rules' | 'skills' | 'hooks' | 'plugins'
  support: 'supported' | 'unsupported'
  reason?: string
  detectPaths: string[]
  cleanup?: { dir: string; prefix: string }[]
  links: {
    source: string
    target: string
    method: 'copy' | 'symlink' | 'native'
  }[]
}
