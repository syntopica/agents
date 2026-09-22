import path from 'node:path'
import { RULES_DIR } from '../constants/RULES_DIR'
import { listFilesRecursive } from '../lib/fs/operations/listFilesRecursive'

export const buildRuleRefSet = async () => {
  const files = await listFilesRecursive(RULES_DIR)
  const refs = new Set<string>()
  for (const file of files) {
    if (!file.endsWith('.mdc')) continue

    const rel = path.relative(RULES_DIR, file).replace(/\\/g, '/')
    refs.add(`@rules/${rel}`)
  }
  return refs
}
