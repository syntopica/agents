import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseSecurityManifest } from '../domains/security/parseSecurityManifest'

export const loadSecurityManifest = async (instanceDir: string) => {
  try {
    const raw = JSON.parse(
      await readFile(join(instanceDir, 'security.json'), 'utf8'),
    ) as unknown
    return parseSecurityManifest(raw)
  } catch (error) {
    return {
      ok: false as const,
      errors: [`security manifest is unreadable: ${String(error)}`],
    }
  }
}
