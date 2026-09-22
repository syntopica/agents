import { cp, lstat, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { cleanGlobalPrefix } from '../../../link/operations/cleanGlobalPrefix'
import { linkOneWithBackup } from '../../../link/operations/linkOneWithBackup'
import { isCapabilityTargetDetected } from './isCapabilityTargetDetected'
import { planCapabilityLinks } from './planCapabilityLinks'
import type { CapabilityTarget } from './types/CapabilityTarget'

export const applyCapabilityLinks = async (target: CapabilityTarget) => {
  if (target.support === 'unsupported') {
    return {
      status: 'unsupported' as const,
      linked: 0,
      copied: 0,
      cleaned: [] as string[],
    }
  }
  if (!(await isCapabilityTargetDetected(target))) {
    return {
      status: 'unavailable' as const,
      linked: 0,
      copied: 0,
      cleaned: [] as string[],
    }
  }

  const cleaned: string[] = []
  for (const cleanup of target.cleanup ?? []) {
    cleaned.push(...(await cleanGlobalPrefix(cleanup.dir, cleanup.prefix)))
  }
  const planned = await planCapabilityLinks(target)
  const changedTargets = new Set(planned.map((change) => change.target))
  let linked = 0
  let copied = 0

  for (const link of target.links) {
    if (link.method === 'native' || !changedTargets.has(link.target)) continue
    if (link.method === 'symlink') {
      await linkOneWithBackup(link)
      linked++
      continue
    }
    const source = await lstat(link.source)
    await mkdir(dirname(link.target), { recursive: true })
    await rm(link.target, { recursive: true, force: true })
    if (source.isDirectory())
      await cp(link.source, link.target, { recursive: true, dereference: true })
    else await writeFile(link.target, await readFile(link.source))
    copied++
  }

  return { status: 'supported' as const, linked, copied, cleaned }
}
