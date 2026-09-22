import { PLATFORM_CAPABILITIES } from './constants/PLATFORM_CAPABILITIES'
import type { PlatformCapability } from './types/PlatformCapability'

export const isPlatformCapability = (
  value: unknown,
): value is PlatformCapability =>
  typeof value === 'string' &&
  (PLATFORM_CAPABILITIES as readonly string[]).includes(value)
