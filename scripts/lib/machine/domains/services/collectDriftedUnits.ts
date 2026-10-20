import { renderServiceUnits } from './renderServiceUnits'
import type { CollectDriftedUnitsInput } from './types/CollectDriftedUnitsInput'
import type { DriftedServiceUnit } from './types/DriftedServiceUnit'

export const collectDriftedUnits = ({
  manifest,
  platform,
  state,
}: CollectDriftedUnitsInput): DriftedServiceUnit[] =>
  manifest.services.flatMap((service) => {
    const units = renderServiceUnits({ service, platform })
    const hasTimer = units.some((unit) => unit.file.endsWith('.timer'))

    return units
      .filter((unit) => state[unit.file] !== unit.contents)
      .map((unit) => ({ ...unit, hasTimer }))
  })
