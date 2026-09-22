import type { PlatformHealth } from './types/PlatformHealth'

export const healthExitCode = (
  report: PlatformHealth[],
  manifestValid: boolean,
): 0 | 1 | 2 => {
  if (!manifestValid) return 2
  const failed = report.some(
    ({ lifecycle, capabilities }) =>
      lifecycle !== 'unavailable' &&
      capabilities.some(
        ({ status }) => status === 'failed' || status === 'auth-required',
      ),
  )
  return failed ? 1 : 0
}
