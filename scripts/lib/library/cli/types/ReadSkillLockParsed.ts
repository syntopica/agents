import type { LockEntry } from '../../types/LockEntry'

export interface ReadSkillLockParsed {
  skills?: Record<string, LockEntry>
}
