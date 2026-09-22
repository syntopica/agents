import type { LiveServer } from '../types/LiveServer'
import type { McpCaptureRefusal } from '../types/McpCaptureRefusal'
import type { McpServer } from '../types/McpServer'
import type { McpTarget } from '../types/McpTarget'
import type { McpValue } from '../types/McpValue'
import { isApprovalMode } from './isApprovalMode'
import { toCapturedTransport } from './toCapturedTransport'
import { toCapturedValues } from './toCapturedValues'

export const toCapturedServer = ({
  name,
  targets,
  live,
  declared,
  refused,
}: {
  name: string
  targets: McpTarget[]
  live: LiveServer
  declared: McpServer | undefined
  refused: McpCaptureRefusal[]
}): McpServer => {
  const transport = toCapturedTransport(live)
  const env = toCapturedValues({
    server: name,
    field: 'env',
    live: live.env,
    declared: declared?.env,
    refused,
  })
  const headers: Record<string, McpValue> = {
    ...Object.fromEntries(
      Object.entries(live.headerReferences).map(([key, variable]) => [
        key,
        { from_env: variable },
      ]),
    ),
    ...toCapturedValues({
      server: name,
      field: 'headers',
      live: live.headers,
      declared: declared?.headers,
      refused,
    }),
  }

  return {
    targets,
    transport,
    ...(live.command === undefined ? {} : { command: live.command }),
    ...(live.args === undefined ? {} : { args: live.args }),
    ...(live.url === undefined ? {} : { url: live.url }),
    ...(live.startup_timeout_sec === undefined
      ? {}
      : { startup_timeout_sec: live.startup_timeout_sec }),
    ...(live.required === undefined ? {} : { required: live.required }),
    ...(isApprovalMode(live.default_tools_approval_mode)
      ? { default_tools_approval_mode: live.default_tools_approval_mode }
      : {}),
    ...(Object.keys(env).length === 0 ? {} : { env }),
    ...(Object.keys(headers).length === 0 ? {} : { headers }),
  }
}
