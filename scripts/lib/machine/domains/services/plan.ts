import { renderServiceUnits } from './renderServiceUnits'
import type { PlanInput } from './types/PlanInput'
import type { ServiceChange } from './types/ServiceChange'

export const plan = ({
  manifest,
  platform,
  state,
}: PlanInput): ServiceChange[] =>
  manifest.services.flatMap((service) =>
    renderServiceUnits({ service, platform }).flatMap((unit) => {
      const current = state[unit.file]

      if (current === unit.contents) {
        return []
      }

      return [
        {
          operation:
            current === undefined ? ('create' as const) : ('update' as const),
          name: service.name,
          file: unit.file,
        },
      ]
    }),
  )
