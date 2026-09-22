import { MACHINE_PROFILES } from './MACHINE_PROFILES'
import type { MachineProfile } from './types/MachineProfile'

export const isMachineProfile = (value: unknown): value is MachineProfile =>
  typeof value === 'string' && Object.hasOwn(MACHINE_PROFILES, value)
