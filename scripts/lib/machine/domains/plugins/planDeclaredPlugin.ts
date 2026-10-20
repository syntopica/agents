import { planEnablement } from './planEnablement'
import type { PlanDeclaredPluginInput } from './types/PlanDeclaredPluginInput'
import type { PluginChange } from './types/PluginChange'

export const planDeclaredPlugin = ({
  plugin,
  installed,
  state,
}: PlanDeclaredPluginInput): PluginChange[] => {
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
