import { open } from 'node:fs/promises'
import { ROLLOUT_HEADER_LIMIT } from './constants/ROLLOUT_HEADER_LIMIT'
import type { SessionFinding } from './types/SessionFinding'

export const readRolloutHeader = async (
  path: string,
): Promise<SessionFinding> => {
  const handle = await open(path, 'r')
  try {
    const buffer = Buffer.alloc(ROLLOUT_HEADER_LIMIT)
    const { bytesRead } = await handle.read(buffer, 0, ROLLOUT_HEADER_LIMIT, 0)
    const contents = buffer.subarray(0, bytesRead).toString('utf8')
    const firstLineEnd = contents.indexOf('\n')
    if (bytesRead === ROLLOUT_HEADER_LIMIT && firstLineEnd === -1) {
      return { path, status: 'malformed', summary: 'header exceeds 64 KiB' }
    }

    const firstRecord = contents
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0)
    if (firstRecord === undefined) {
      return {
        path,
        status: 'malformed',
        summary: 'session has no usable records',
      }
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(firstRecord) as unknown
    } catch {
      return {
        path,
        status: 'malformed',
        summary: 'first record is not valid JSON',
      }
    }
    if (typeof parsed !== 'object' || parsed === null || !('type' in parsed)) {
      return {
        path,
        status: 'malformed',
        summary: 'first record is not session_meta',
      }
    }
    if (parsed.type !== 'session_meta' || !('payload' in parsed)) {
      return {
        path,
        status: 'malformed',
        summary: 'first record is not session_meta',
      }
    }

    const payload = parsed.payload
    if (typeof payload !== 'object' || payload === null || !('id' in payload)) {
      return {
        path,
        status: 'malformed',
        summary: 'session_meta has no session id',
      }
    }
    if (typeof payload.id !== 'string' || payload.id.length === 0) {
      return {
        path,
        status: 'malformed',
        summary: 'session_meta has no session id',
      }
    }
    return {
      path,
      status: 'ok',
      sessionId: payload.id,
      summary: 'valid session_meta header',
    }
  } finally {
    await handle.close()
  }
}
