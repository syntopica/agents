import type { PLATFORM_LIFECYCLES } from '../constants/PLATFORM_LIFECYCLES'

export type PlatformLifecycle = (typeof PLATFORM_LIFECYCLES)[number]
