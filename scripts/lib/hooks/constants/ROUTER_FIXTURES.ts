import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { RouterFixtures } from './types/RouterFixtures'

/**
 * Router fixtures compiled from the reviewed expectation corpus. Every prompt
 * is copied verbatim from a measured transcript.
 */
export const ROUTER_FIXTURES = JSON.parse(
  readFileSync(
    path.join(
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..'),
      'src/hooks/router-fixtures.json',
    ),
    'utf8',
  ),
) as RouterFixtures
