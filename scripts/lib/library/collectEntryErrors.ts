import { CURATION_STATES } from './constants/CURATION_STATES'

export const collectEntryErrors = (
  name: string,
  entry: unknown,
  errors: string[],
) => {
  if (typeof entry !== 'object' || entry === null) {
    errors.push(`${name}: entry must be an object`)
    return
  }

  const record = entry as Record<string, unknown>
  const state = record['state']

  if (
    typeof state !== 'string' ||
    !(CURATION_STATES as readonly string[]).includes(state)
  ) {
    errors.push(`${name}: unknown state ${String(state)}`)
    return
  }

  if (state === 'forked') {
    if (typeof record['patch'] !== 'string') {
      errors.push(`${name}: forked entries need a patch`)
    }
    if (typeof record['upstreamHash'] !== 'string') {
      errors.push(`${name}: forked entries need an upstreamHash`)
    }
  }

  if (state === 'extracted' && typeof record['extractedInto'] !== 'string') {
    errors.push(`${name}: extracted entries need extractedInto`)
  }

  if (state === 'parked' && typeof record['reason'] !== 'string') {
    errors.push(`${name}: parked entries need a reason`)
  }
}
