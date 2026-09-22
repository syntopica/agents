import { join } from 'node:path'
import { flagValue } from '../machine/cli/flagValue'
import { resolveInstanceDir } from '../machine/instance/resolveInstanceDir'

/**
 * Where `skills.json` is read from. It is a machine manifest like the others,
 * so it follows `AGENTS_MACHINE_DIR` rather than assuming a `machine/`
 * directory inside this repository: the manifests are instance data and live
 * in the private instance, while `examples/machine/` stays the public
 * template.
 */
export const resolveSkillSourceManifestPath = (
  argv: string[],
  env: NodeJS.ProcessEnv,
  root: string,
): string => {
  const manifest = flagValue(argv, '--manifest')
  if (manifest) {
    return manifest
  }

  const machineDir = flagValue(argv, '--machine-dir')

  return join(
    resolveInstanceDir({
      ...(machineDir === undefined ? {} : { flag: machineDir }),
      env,
      root,
    }),
    'skills.json',
  )
}
