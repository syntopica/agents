import { join } from 'node:path'
import { renderServiceUnits } from './renderServiceUnits'
import type { ServicesManifestParseResult } from './types/ServicesManifestParseResult'
import type { ServicesPaths } from './types/ServicesPaths'

/**
 * Every unit file an apply could write, so the run snapshot can restore them.
 * A path that does not exist yet is still returned: the snapshot records it as
 * absent, which is what lets a rollback remove a newly created unit.
 */
export const resolveDeclaredUnitPaths = ({
  parsed,
  paths,
}: {
  parsed: ServicesManifestParseResult | undefined
  paths: ServicesPaths
}): string[] => {
  if (parsed?.ok !== true) {
    return []
  }

  return parsed.manifest.services.flatMap((service) =>
    renderServiceUnits({ service, platform: paths.platform }).map((unit) =>
      join(paths.directory, unit.file),
    ),
  )
}
