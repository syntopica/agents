import type { McpCapture } from '../types/McpCapture'
import type { McpCaptureRefusal } from '../types/McpCaptureRefusal'
import type { McpManifest } from '../types/McpManifest'
import type { McpServer } from '../types/McpServer'
import type { McpState } from '../types/McpState'
import { collectServerTargets } from './collectServerTargets'
import { toCapturedServer } from './toCapturedServer'
import { toLiveServer } from './toLiveServer'

export const captureMcpManifest = ({
  state,
  declared,
}: {
  state: McpState
  declared: McpManifest | undefined
}): McpCapture => {
  const servers: Record<string, McpServer> = {}
  const refused: McpCaptureRefusal[] = []

  for (const [name, targets] of collectServerTargets(state)) {
    const target = targets[0] ?? 'claude-personal'
    const live = state.byTarget[target][name]
    const refusedBefore = refused.length
    const server = toCapturedServer({
      name,
      targets,
      live: toLiveServer({
        live:
          typeof live === 'object' && live !== null
            ? (live as Record<string, unknown>)
            : {},
        target,
      }),
      declared: declared?.servers[name],
      refused,
    })

    if (refused.length === refusedBefore) {
      servers[name] = server
    }
  }

  return { manifest: { servers }, refused }
}
