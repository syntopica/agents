import { flagValues } from './flagValues'

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
}: {
  argv: string[]
  profileDomains: readonly string[]
}): { domains: string[] } | { errors: string[] } => {
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
