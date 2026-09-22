import { HOOKS_DIST_DIR } from '../../../commands/constants/HOOKS_DIST_DIR'
import { CANONICAL_HOOKS_DIR } from '../../link/constants/CANONICAL_HOOKS_DIR'
import { CANONICAL_SKILLS_DIR } from '../../link/constants/CANONICAL_SKILLS_DIR'
import { IDE_RULE_TARGETS } from '../../link/constants/IDE_RULE_TARGETS'
import type { CapabilityTarget } from '../domains/capabilities/types/CapabilityTarget'

export const resolveCapabilityTargets = (): CapabilityTarget[] => [
  ...IDE_RULE_TARGETS.map((ruleTarget) => ({
    id: `${ruleTarget.ide.id}-rules`,
    capability: 'rules' as const,
    support: 'supported' as const,
    detectPaths:
      ruleTarget.ide.detectPaths ??
      (ruleTarget.ide.rootDir ? [ruleTarget.ide.rootDir] : []),
    ...(ruleTarget.cleanup === undefined
      ? {}
      : { cleanup: [ruleTarget.cleanup] }),
    links: ruleTarget.links,
  })),
  {
    id: 'canonical-hooks',
    capability: 'hooks',
    support: 'supported',
    detectPaths: [],
    links: [
      { source: HOOKS_DIST_DIR, target: CANONICAL_HOOKS_DIR, method: 'copy' },
    ],
  },
  {
    id: 'canonical-skills',
    capability: 'skills',
    support: 'supported',
    detectPaths: [],
    links: [
      {
        source: CANONICAL_SKILLS_DIR,
        target: CANONICAL_SKILLS_DIR,
        method: 'native',
      },
    ],
  },
]
