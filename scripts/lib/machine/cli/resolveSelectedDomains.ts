import { flagValues } from './flagValues'
import type { RejectedDomains } from './types/RejectedDomains'
import type { ResolveSelectedDomainsInput } from './types/ResolveSelectedDomainsInput'
import type { SelectedDomains } from './types/SelectedDomains'

/**
 * The domains one run may converge. Without `--domain` a run converges the
 * whole profile, which is what `machine:apply` has always done; with it, a run
 * can converge one domain and leave the rest alone. That distinction was
 * missing on 2026-08-31, when applying a converged plugins domain would also
 * have written three MCP servers nobody had asked for.
 */
export const resolveSelectedDomains = ({
  argv,
  profileDomains,
}: ResolveSelectedDomainsInput): SelectedDomains | RejectedDomains => {
  const requested = flagValues(argv, '--domain')
  if (requested.length === 0) return { domains: [...profileDomains] }

  const unknown = requested.filter((name) => !profileDomains.includes(name))
  if (unknown.length > 0) {
    return {
      errors: unknown.map(
        (name) =>
          `unknown domain ${name}; this profile has ${profileDomains.join(', ')}`,
      ),
    }
  }

  return { domains: [...new Set(requested)] }
}
