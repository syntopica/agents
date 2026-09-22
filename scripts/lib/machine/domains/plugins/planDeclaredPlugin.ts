import { planEnablement } from './planEnablement'
import type { DeclaredPlugin } from './types/DeclaredPlugin'
import type { InstalledPlugin } from './types/InstalledPlugin'
import type { PluginChange } from './types/PluginChange'
import type { PluginsState } from './types/PluginsState'

export const planDeclaredPlugin = ({
  plugin,
  installed,
  state,
}: {
  plugin: DeclaredPlugin
  installed: InstalledPlugin | undefined
  state: PluginsState
}): PluginChange[] => {
  if (installed === undefined) {
    return [{ operation: 'install', id: plugin.id, detail: plugin.version }]
  }

  const pin: PluginChange[] =
    installed.version === plugin.version
      ? []
      : [
          {
            operation: 'pin',
            id: plugin.id,
            detail: `${installed.version} -> ${plugin.version}`,
          },
        ]

  return [...pin, ...planEnablement({ plugin, state })]
}
