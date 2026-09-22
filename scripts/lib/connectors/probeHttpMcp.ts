import { buildMcpInitializeRequest } from './buildMcpInitializeRequest'
import { classifyHttpProbe } from './classifyHttpProbe'
import { readBoundedResponseText } from './readBoundedResponseText'
import type { HttpProbeResult } from './types/HttpProbeResult'

export const probeHttpMcp = async (
  endpoint: string,
  timeoutMs = 5_000,
): Promise<HttpProbeResult> => {
  const startedAt = performance.now()
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        accept: 'application/json, text/event-stream',
        'content-type': 'application/json',
      },
      body: JSON.stringify(buildMcpInitializeRequest()),
      signal: AbortSignal.timeout(timeoutMs),
    })
    return classifyHttpProbe({
      httpCode: response.status,
      body: await readBoundedResponseText(response, 65_536),
      retryAfter: response.headers.get('retry-after'),
      durationMs: Math.round(performance.now() - startedAt),
    })
  } catch (error) {
    const timedOut =
      error instanceof DOMException && error.name === 'TimeoutError'
    return {
      status: 'failed',
      boundary: 'network',
      durationMs: Math.round(performance.now() - startedAt),
      summary: timedOut
        ? 'connector request timed out'
        : 'connector request failed',
    }
  }
}
