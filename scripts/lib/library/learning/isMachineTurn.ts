import { MACHINE_TURN_PATTERNS } from './constants/MACHINE_TURN_PATTERNS'

export const isMachineTurn = (text: string) =>
  MACHINE_TURN_PATTERNS.some((pattern) => pattern.test(text.trimStart()))
