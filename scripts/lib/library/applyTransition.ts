import { deriveNestedEntry } from './deriveNestedEntry'
import { parseCurationManifest } from './parseCurationManifest'
import type { CurationEntry } from './types/CurationEntry'
import type { CurationManifest } from './types/CurationManifest'
import type { CurationState } from './types/CurationState'
import type { TransitionResult } from './types/TransitionResult'

export const applyTransition = (
  manifest: CurationManifest,
  name: string,
  state: CurationState,
  extras: Partial<CurationEntry>,
  today: string,
): TransitionResult => {
  const existing = manifest.entries[name]
  const parentName = name.includes('/')
    ? name.slice(0, name.indexOf('/'))
    : undefined
  const parent =
    parentName === undefined ? undefined : manifest.entries[parentName]

  if (existing === undefined && parent === undefined) {
    return { ok: false, error: `${name} is not in the library` }
  }

  const inherited: CurationEntry =
    parent === undefined
      ? { state: 'parked' }
      : { state: 'parked', ...deriveNestedEntry(parent) }

  const current = existing ?? inherited

  const next: CurationManifest = {
    ...manifest,
    entries: {
      ...manifest.entries,
      [name]: { ...current, ...extras, state, decidedAt: today },
    },
  }

  const parsed = parseCurationManifest(next)

  if (!parsed.ok) {
    return { ok: false, error: parsed.errors.join('; ') }
  }

  return { ok: true, manifest: next }
}
