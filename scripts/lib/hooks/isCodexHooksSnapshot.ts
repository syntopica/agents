import { isRecord } from '../guidance/isRecord'
import type { CodexHooksSnapshot } from './types/CodexHooksSnapshot'

export const isCodexHooksSnapshot = (
  value: unknown,
): value is CodexHooksSnapshot => {
  if (!isRecord(value) || !Array.isArray(value['data'])) return false
  return value['data'].every((entry: unknown) => {
    if (
      !isRecord(entry) ||
      typeof entry['cwd'] !== 'string' ||
      !Array.isArray(entry['hooks']) ||
      !Array.isArray(entry['warnings']) ||
      !Array.isArray(entry['errors'])
    )
      return false
    return (
      entry['warnings'].every(
        (warning: unknown) => typeof warning === 'string',
      ) &&
      entry['errors'].every(
        (error: unknown) =>
          isRecord(error) &&
          typeof error['message'] === 'string' &&
          typeof error['path'] === 'string',
      ) &&
      entry['hooks'].every(
        (hook: unknown) =>
          isRecord(hook) &&
          typeof hook['eventName'] === 'string' &&
          typeof hook['handlerType'] === 'string' &&
          typeof hook['enabled'] === 'boolean' &&
          typeof hook['trustStatus'] === 'string' &&
          ['trusted', 'managed', 'untrusted', 'modified'].includes(
            hook['trustStatus'],
          ) &&
          (hook['matcher'] === undefined ||
            hook['matcher'] === null ||
            typeof hook['matcher'] === 'string') &&
          (hook['handlerType'] !== 'command' ||
            typeof hook['command'] === 'string'),
      )
    )
  })
}
