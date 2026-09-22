import { join } from 'node:path'
import type { ServicesPaths } from '../domains/services/types/ServicesPaths'

export const resolveServicesPaths = ({
  home,
  platform,
}: {
  home: string
  platform: NodeJS.Platform
}): ServicesPaths =>
  platform === 'darwin'
    ? { platform: 'launchd', directory: join(home, 'Library', 'LaunchAgents') }
    : {
        platform: 'systemd',
        directory: join(home, '.config', 'systemd', 'user'),
      }
