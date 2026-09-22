import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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
) as {
  phraseCount: number
  sourceAssociationCount: number
  routes: Record<string, string[]>
  silent: { prompts: string[] }
}
