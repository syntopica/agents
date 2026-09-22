import { pathExists } from '../../../link/operations/pathExists'
import type { CapabilityTarget } from './types/CapabilityTarget'

export const isCapabilityTargetDetected = async (target: CapabilityTarget) =>
  target.detectPaths.length === 0 ||
  (await Promise.all(target.detectPaths.map((path) => pathExists(path)))).some(
    Boolean,
  )
