import { normalizeCodexServer } from '../normalizeCodexServer'
import { normalizeCodexSubTable } from '../normalizeCodexSubTable'
import type { LiveServer } from '../types/LiveServer'
import type { McpTarget } from '../types/McpTarget'
import { toRecord } from './toRecord'
import { toStringArray } from './toStringArray'

export const toLiveServer = ({
  live,
  target,
}: {
  live: Record<string, unknown>
  target: McpTarget
}): LiveServer => {
  if (target === 'codex') {
    const record = live as Record<string, string>
    const normalized = normalizeCodexServer(record)

    return {
      ...normalized,
      env: normalizeCodexSubTable(record, 'env') ?? {},
      headers: normalized.http_headers ?? {},
      headerReferences: normalized.env_http_headers ?? {},
    }
  }

  const args = toStringArray(live['args'])

  return {
    ...(typeof live['command'] === 'string'
      ? { command: live['command'] }
      : {}),
    ...(args === undefined ? {} : { args }),
    ...(typeof live['url'] === 'string' ? { url: live['url'] } : {}),
    ...(typeof live['type'] === 'string' ? { type: live['type'] } : {}),
    env: toRecord(live['env']),
    headers: toRecord(live['headers']),
    headerReferences: {},
  }
}
