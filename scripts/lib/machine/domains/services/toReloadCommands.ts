import type { ServicesPlatform } from './types/ServicesPlatform'

/**
 * Commands that make the init system pick up one freshly written unit file.
 * launchd needs a bootout (tolerated to fail when the job was never loaded)
 * followed by a bootstrap; systemd needs a daemon-reload (issued once by the
 * caller) plus enable --now on the unit that drives the service - the timer
 * when one exists, the service unit otherwise.
 */
export const toReloadCommands = ({
  platform,
  unitPath,
  unitFile,
  uid,
  hasTimer,
}: {
  platform: ServicesPlatform
  unitPath: string
  unitFile: string
  uid: number
  hasTimer: boolean
}): { argv: string[]; tolerateFailure: boolean }[] => {
  if (platform === 'launchd') {
    return [
      {
        argv: ['launchctl', 'bootout', `gui/${String(uid)}`, unitPath],
        tolerateFailure: true,
      },
      {
        argv: ['launchctl', 'bootstrap', `gui/${String(uid)}`, unitPath],
        tolerateFailure: false,
      },
    ]
  }

  if (unitFile.endsWith('.service') && hasTimer) {
    return []
  }

  return [
    {
      argv: ['systemctl', '--user', 'enable', '--now', unitFile],
      tolerateFailure: false,
    },
  ]
}
