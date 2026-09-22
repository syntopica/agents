import { existsSync } from 'node:fs'
import path from 'node:path'
import { HOME } from '../constants/HOME'

export const getOpenClawRootDir = () => {
  const candidates = [
    path.join(HOME, '.openclaw'),
    path.join(HOME, '.clawdbot'),
    path.join(HOME, '.moltbot'),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }

  return candidates[0]
}
