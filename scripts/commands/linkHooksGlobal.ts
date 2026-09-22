import { CANONICAL_HOOKS_DIR } from '../lib/link/constants/CANONICAL_HOOKS_DIR'
import { applyCapabilityLinks } from '../lib/machine/domains/capabilities/applyCapabilityLinks'
import { HOOKS_DIST_DIR } from './constants/HOOKS_DIST_DIR'

/**
 * Copy built hooks into the canonical hooks directory, mirroring skills:link.
 *
 * Hooks reach Claude Code only through settings.json or an installed plugin, and
 * pointing either at a repo path makes them silently dead the moment the repo
 * moves. Settings should reference ~/.agents/hooks/<name> instead.
 */
export const main = async () => {
  await applyCapabilityLinks({
    id: 'canonical-hooks',
    capability: 'hooks',
    support: 'supported',
    detectPaths: [],
    links: [
      { source: HOOKS_DIST_DIR, target: CANONICAL_HOOKS_DIR, method: 'copy' },
    ],
  })
  console.log(`Hooks -> ${CANONICAL_HOOKS_DIR}`)
  console.log(
    'Point ~/.claude/settings.json at that path so hooks survive a repo move.',
  )
}
