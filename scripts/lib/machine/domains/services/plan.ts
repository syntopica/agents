import { renderServiceUnits } from './renderServiceUnits'
import type { ServiceChange } from './types/ServiceChange'
import type { ServicesManifest } from './types/ServicesManifest'
import type { ServicesPlatform } from './types/ServicesPlatform'
import type { ServicesState } from './types/ServicesState'

export const plan = ({
  manifest,
  platform,
  state,
}: {
  manifest: ServicesManifest
  platform: ServicesPlatform
  state: ServicesState
}): ServiceChange[] =>
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
