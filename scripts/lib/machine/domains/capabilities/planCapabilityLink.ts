import { lstat, readlink } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathExists } from '../../../link/operations/pathExists'
import { hasSameCapabilityContent } from './hasSameCapabilityContent'
import type { CapabilityTarget } from './types/CapabilityTarget'

export const planCapabilityLink = async (
  link: CapabilityTarget['links'][number],
) => {
  if (!(await pathExists(link.source))) return undefined
  if (!(await pathExists(link.target)))
    return { target: link.target, operation: 'add' as const }
  if (link.method === 'copy') {
    return (await hasSameCapabilityContent(link.source, link.target))
      ? undefined
      : { target: link.target, operation: 'update' as const }
  }
  if (link.method === 'native') return undefined
  const stat = await lstat(link.target)
  if (!stat.isSymbolicLink())
    return { target: link.target, operation: 'update' as const }
  const actual = resolve(dirname(link.target), await readlink(link.target))
  return actual === resolve(link.source)
    ? undefined
    : { target: link.target, operation: 'update' as const }
}
