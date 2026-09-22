import type { HttpProbeClassificationInput } from './types/HttpProbeClassificationInput'
import type { HttpProbeResult } from './types/HttpProbeResult'

export const classifyHttpProbe = ({
  httpCode,
  body,
  retryAfter,
  durationMs,
}: HttpProbeClassificationInput): HttpProbeResult => {
  if (httpCode === 401 || httpCode === 403) {
    return {
      status: 'auth-required',
      boundary: 'target',
      httpCode,
      durationMs,
      summary: 'authentication required',
    }
  }
  if (httpCode === 429) {
    const parsedRetry = Number.parseInt(retryAfter ?? '', 10)
    return {
      status: 'degraded',
      boundary: 'target',
      httpCode,
      ...(Number.isFinite(parsedRetry)
        ? { retryAfterSeconds: parsedRetry }
        : {}),
      durationMs,
      summary: 'connector rate limited',
    }
  }
  if (httpCode >= 500) {
    return {
      status: 'failed',
      boundary: 'target',
      httpCode,
      durationMs,
      summary: 'connector unavailable',
    }
  }
  if (httpCode < 200 || httpCode >= 300) {
    return {
      status: 'failed',
      boundary: 'target',
      httpCode,
      durationMs,
      summary: 'unexpected HTTP response',
    }
  }
  try {
    const payload = JSON.parse(body) as Record<string, unknown>
    const result = payload['result']
    const isMcp =
      payload['jsonrpc'] === '2.0' &&
      typeof result === 'object' &&
      result !== null &&
      typeof (result as Record<string, unknown>)['protocolVersion'] === 'string'
    return isMcp
      ? {
          status: 'healthy',
          boundary: 'target',
          httpCode,
          durationMs,
          summary: 'MCP initialize succeeded',
        }
      : {
          status: 'failed',
          boundary: 'target',
          httpCode,
          durationMs,
          summary: 'response is not MCP initialize output',
        }
  } catch {
    return {
      status: 'failed',
      boundary: 'target',
      httpCode,
      durationMs,
      summary: 'response is not valid JSON',
    }
  }
}
