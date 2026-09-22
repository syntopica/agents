import type { GuidanceLockObservation } from './types/GuidanceLockObservation'

export const isSameGuidanceLock = (
  left: GuidanceLockObservation,
  right: GuidanceLockObservation,
): boolean =>
  left.device === right.device &&
  left.inode === right.inode &&
  left.owner === right.owner
