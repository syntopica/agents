import { lstat, readlink } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathExists } from '../../../link/operations/pathExists'
import type { CapabilityTarget } from './types/CapabilityTarget'

export const verifyCapabilityLink = async (
  link: CapabilityTarget['links'][number],
) => {
  if (!(await pathExists(link.source))) {
    return {
      target: link.target,
      status: 'source-missing',
      detail: link.source,
    }
  }
  if (!(await pathExists(link.target))) {
    return {
      target: link.target,
      status: 'target-missing',
      detail: link.source,
    }
  }
  if (link.method !== 'symlink') {
    return { target: link.target, status: 'healthy', detail: link.source }
  }
  const stat = await lstat(link.target)
  if (!stat.isSymbolicLink()) {
    return { target: link.target, status: 'stale', detail: 'expected symlink' }
  }
  const actual = resolve(dirname(link.target), await readlink(link.target))
  if (!(await pathExists(actual)))
    return { target: link.target, status: 'broken', detail: actual }
  if (actual !== resolve(link.source)) {
    return { target: link.target, status: 'stale', detail: actual }
  }
  return { target: link.target, status: 'healthy', detail: link.source }
}
