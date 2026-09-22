import type { PluginEnablement } from './types/PluginEnablement'

export const toEnablement = (
  declared: Record<string, boolean>,
  id: string,
): PluginEnablement => {
  if (!(id in declared)) {
    return 'undeclared'
  }

  return declared[id] === true ? 'enabled' : 'disabled'
}
