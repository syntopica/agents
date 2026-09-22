import type { PluginManifest } from '../types/PluginManifest'
import { extractRepositoryUrl } from './extractRepositoryUrl'

export const buildPluginManifest = (
  pkg: Record<string, unknown>,
): PluginManifest => {
  const version = typeof pkg['version'] === 'string' ? pkg['version'] : '0.0.0'
  const license =
    typeof pkg['license'] === 'string' ? pkg['license'] : undefined
  const repositoryUrl = extractRepositoryUrl(pkg)

  return {
    name: 'rocket-agents',
    version,
    description:
      'BRP workflow skills (plan, implement, fix, refactor, test, review, debug, docs) plus a code-quality audit skill, with a cross-stack rules index loaded on demand.',
    author: { name: 'BusiRocket', url: 'https://github.com/BusiRocket' },
    ...(repositoryUrl
      ? { repository: { type: 'git', url: repositoryUrl } }
      : {}),
    ...(repositoryUrl ? { homepage: repositoryUrl.replace(/\.git$/, '') } : {}),
    ...(license ? { license } : {}),
    keywords: [
      'claude-code',
      'skills',
      'workflow',
      'planning',
      'code-review',
      'refactoring',
      'typescript',
      'nextjs',
    ],
    hooks: './hooks/hooks.json',
  }
}
