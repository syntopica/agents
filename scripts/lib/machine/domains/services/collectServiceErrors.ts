import { collectScheduleErrors } from './collectScheduleErrors'
import { isPortableHomePath } from './isPortableHomePath'

export const collectServiceErrors = (
  raw: unknown,
  index: number,
  errors: string[],
) => {
  const at = `manifest.services[${String(index)}]`

  if (typeof raw !== 'object' || raw === null) {
    errors.push(`${at} must be an object`)
    return
  }

  const service = raw as Record<string, unknown>

  if (
    typeof service['name'] !== 'string' ||
    !/^[a-z0-9.-]+$/.test(service['name'])
  ) {
    errors.push(`${at}.name must be a lowercase reverse-domain label`)
  }
  if (typeof service['command'] !== 'string' || service['command'] === '') {
    errors.push(`${at}.command must be a non-empty string`)
  }
  if (!isPortableHomePath(service['workingDirectory'])) {
    errors.push(
      `${at}.workingDirectory must be a path relative to the home directory`,
    )
  }
  if (
    service['logPath'] !== undefined &&
    !isPortableHomePath(service['logPath'])
  ) {
    errors.push(`${at}.logPath must be a path relative to the home directory`)
  }

  for (const key of ['runAtLoad', 'keepAlive']) {
    if (service[key] !== undefined && typeof service[key] !== 'boolean') {
      errors.push(`${at}.${key} must be a boolean`)
    }
  }

  collectScheduleErrors(service['schedule'], at, errors)
}
