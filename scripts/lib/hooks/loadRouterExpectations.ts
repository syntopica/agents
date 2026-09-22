import { readFile } from 'node:fs/promises'
import type { RouterExpectation } from './types/RouterExpectation'
import type { RouterExpectationsManifest } from './types/RouterExpectationsManifest'

export const loadRouterExpectations = async (
  path: string,
): Promise<RouterExpectationsManifest> => {
  const raw = JSON.parse(await readFile(path, 'utf8')) as unknown
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('router expectations must be an object')
  }
  const record = raw as Record<string, unknown>
  if (record['version'] !== 1 || !Array.isArray(record['expectations'])) {
    throw new Error(
      'router expectations need version 1 and an expectations array',
    )
  }
  for (const value of record['expectations']) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error('router expectation must be an object')
    }
    const expectation = value as Partial<RouterExpectation>
    const hasLane = typeof expectation.expectedLane === 'string'
    const isSilent = expectation.intentionalSilence === true
    if (
      typeof expectation.phrase !== 'string' ||
      expectation.phrase === '' ||
      !Array.isArray(expectation.sourceSkills) ||
      expectation.sourceSkills.length === 0 ||
      typeof expectation.reason !== 'string' ||
      expectation.reason === '' ||
      hasLane === isSilent
    ) {
      throw new Error('router expectation is incomplete or ambiguous')
    }
  }
  return raw as RouterExpectationsManifest
}
