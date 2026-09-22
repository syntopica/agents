import { isRecord } from './isRecord'
import { parseGuidanceInputHashes } from './parseGuidanceInputHashes'
import type { AcceptedGuidanceState } from './types/AcceptedGuidanceState'

export const parseAcceptedGuidanceState = (
  raw: unknown,
):
  { ok: true; state: AcceptedGuidanceState } | { ok: false; error: string } => {
  if (!isRecord(raw))
    return { ok: false, error: 'accepted guidance state must be an object' }
  if (
    Object.keys(raw).length !== 4 ||
    !['runId', 'acceptedAt', 'inputHashes', 'outputHashes'].every((key) =>
      Object.hasOwn(raw, key),
    ) ||
    typeof raw['runId'] !== 'string' ||
    raw['runId'] === '' ||
    typeof raw['acceptedAt'] !== 'string' ||
    !Number.isFinite(Date.parse(raw['acceptedAt']))
  )
    return { ok: false, error: 'accepted guidance state has an invalid shape' }
  const outputHashes = raw['outputHashes']
  if (!isRecord(outputHashes))
    return { ok: false, error: 'accepted guidance state has an invalid shape' }
  const parsedInputs = parseGuidanceInputHashes(raw['inputHashes'])
  if (!parsedInputs.ok) return { ok: false, error: parsedInputs.error }
  const outputKeys = [
    'shared',
    'claudeOverlay',
    'codexOverlay',
    'claudeDocument',
    'codexDocument',
  ]
  if (
    Object.keys(outputHashes).length !== outputKeys.length ||
    !outputKeys.every((key) => Object.hasOwn(outputHashes, key)) ||
    !outputKeys.every(
      (key) =>
        typeof outputHashes[key] === 'string' &&
        /^[a-f0-9]{64}$/u.test(outputHashes[key]),
    )
  )
    return { ok: false, error: 'accepted guidance output hashes are invalid' }
  return {
    ok: true,
    state: {
      runId: raw['runId'],
      acceptedAt: raw['acceptedAt'],
      inputHashes: parsedInputs.inputHashes,
      outputHashes:
        outputHashes as unknown as AcceptedGuidanceState['outputHashes'],
    },
  }
}
