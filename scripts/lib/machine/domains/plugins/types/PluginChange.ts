import type { PluginProfile } from './PluginProfile'

export interface PluginChange {
  operation: 'install' | 'remove' | 'pin' | 'enable' | 'disable'
  id: string
  detail: string
  profile?: PluginProfile
}
