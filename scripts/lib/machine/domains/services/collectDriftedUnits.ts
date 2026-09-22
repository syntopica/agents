import { renderServiceUnits } from './renderServiceUnits'
import type { DriftedServiceUnit } from './types/DriftedServiceUnit'
import type { ServicesManifest } from './types/ServicesManifest'
import type { ServicesPlatform } from './types/ServicesPlatform'
import type { ServicesState } from './types/ServicesState'

export const collectDriftedUnits = ({
  manifest,
  platform,
  state,
}: {
  manifest: ServicesManifest
  platform: ServicesPlatform
  state: ServicesState
}): DriftedServiceUnit[] =>
  manifest.services.flatMap((service) => {
    const units = renderServiceUnits({ service, platform })
    const hasTimer = units.some((unit) => unit.file.endsWith('.timer'))

    return units
      .filter((unit) => state[unit.file] !== unit.contents)
      .map((unit) => ({ ...unit, hasTimer }))
  })
