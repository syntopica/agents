import { join } from 'node:path'
import type { ServicesPaths } from '../domains/services/types/ServicesPaths'
import type { ResolveServicesPathsInput } from './types/ResolveServicesPathsInput'

export const resolveServicesPaths = ({
  home,
  platform,
}: ResolveServicesPathsInput): ServicesPaths =>
  platform === 'darwin'
    ? { platform: 'launchd', directory: join(home, 'Library', 'LaunchAgents') }
    : {
        platform: 'systemd',
        directory: join(home, '.config', 'systemd', 'user'),
      }
