import path from 'node:path'
import { HOME } from './HOME'

/**
 * Canonical hooks directory. Hooks live here rather than being referenced from a
 * repo checkout, so a moved or renamed clone cannot silently stop them firing.
 */
export const CANONICAL_HOOKS_DIR = path.join(HOME, '.agents', 'hooks')
