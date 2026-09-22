import type { CommandRunner } from '../../exec/types/CommandRunner'
import type { DomainResult } from '../../types/DomainResult'
import { apply } from './apply'
import { read } from './read'
import { toServicesApplyStatus } from './toServicesApplyStatus'
import type { ServicesManifestParseResult } from './types/ServicesManifestParseResult'
import type { ServicesPaths } from './types/ServicesPaths'

/**
 * Writes and loads the declared units, then reports the domain result. Like
 * plugins, a missing manifest is skipped: the real service descriptions carry
 * machine values and live in the private dotfiles repo.
 */
export const runServicesApply = async ({
  parsed,
  paths,
  uid,
  run,
}: {
  parsed: ServicesManifestParseResult | undefined
  paths: ServicesPaths
  uid: number
  run: CommandRunner
}): Promise<DomainResult> => {
  if (parsed === undefined) {
    return {
      domain: 'services',
      status: 'skipped',
      changes: 0,
      messages: ['no services.json in the instance directory'],
    }
  }

  if (!parsed.ok) {
    return {
      domain: 'services',
      status: 'failed',
      changes: 0,
      messages: parsed.errors,
    }
  }

  const result = await apply({
    manifest: parsed.manifest,
    paths,
    state: await read(paths),
    uid,
    run,
  })

  return {
    domain: 'services',
    status: toServicesApplyStatus(result),
    changes: result.written.length,
    messages: [
      ...result.written.map((file) => `wrote ${file}`),
      ...result.failed.map((message) => `failed ${message}`),
    ],
  }
}
