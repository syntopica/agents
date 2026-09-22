import { homedir } from 'node:os'
import { ROOT } from '../constants/ROOT'
import { createManagedAgentCliEnvironment } from '../lib/connectors/createManagedAgentCliEnvironment'
import { inspectProfileConnectors } from '../lib/connectors/inspectProfileConnectors'
import { loadConnectorManifest } from '../lib/connectors/loadConnectorManifest'
import { runConnectorDoctor } from '../lib/connectors/runConnectorDoctor'
import { flagValue } from '../lib/machine/cli/flagValue'
import { loadMcpManifest } from '../lib/machine/cli/loadMcpManifest'
import { resolveInstanceDir } from '../lib/machine/instance/resolveInstanceDir'

export const main = async () => {
  const home = homedir()
  const env = createManagedAgentCliEnvironment(home, process.env)
  process.env['PATH'] = env['PATH']
  const instance = flagValue(process.argv, '--instance')
  const instanceDir = resolveInstanceDir({
    ...(instance === undefined ? {} : { flag: instance }),
    env: process.env,
    root: ROOT,
  })
  const parsed = await loadConnectorManifest(instanceDir)
  const parsedMcp = await loadMcpManifest(instanceDir)
  const requested = flagValue(process.argv, '--profile')
  const result = await runConnectorDoctor({
    parsed,
    parsedMcp,
    requestedProfile: requested,
    home,
    env,
    inspect: inspectProfileConnectors,
  })
  console.log(JSON.stringify(result.output, null, 2))
  process.exitCode = result.exitCode
}
