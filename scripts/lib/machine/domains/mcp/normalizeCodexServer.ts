import { normalizeCodexSubTable } from './normalizeCodexSubTable'
import { parseTomlArray } from './parseTomlArray'
import type { NormalizedCodexServer } from './types/NormalizedCodexServer'
import { unquoteTomlString } from './unquoteTomlString'

export const normalizeCodexServer = (
  record: Record<string, string>,
): NormalizedCodexServer => {
  const normalized: NormalizedCodexServer = {}

  if (record['command'] !== undefined) {
    normalized.command = unquoteTomlString(record['command'])
  }

  if (record['args'] !== undefined) {
    normalized.args = parseTomlArray(record['args'])
  }

  if (record['url'] !== undefined) {
    normalized.url = unquoteTomlString(record['url'])
  }

  if (record['startup_timeout_sec'] !== undefined) {
    normalized.startup_timeout_sec = Number(record['startup_timeout_sec'])
  }

  if (record['required'] !== undefined) {
    normalized.required = record['required'] === 'true'
  }

  if (record['default_tools_approval_mode'] !== undefined) {
    normalized.default_tools_approval_mode = unquoteTomlString(
      record['default_tools_approval_mode'],
    )
  }

  const httpHeaders = normalizeCodexSubTable(record, 'http_headers')
  if (httpHeaders !== undefined) {
    normalized.http_headers = httpHeaders
  }

  const environmentHeaders = normalizeCodexSubTable(record, 'env_http_headers')
  if (environmentHeaders !== undefined) {
    normalized.env_http_headers = environmentHeaders
  }

  return normalized
}
