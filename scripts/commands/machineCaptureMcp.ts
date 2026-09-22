import { homedir } from 'node:os'
import { ROOT } from '../constants/ROOT'
import { flagValue } from '../lib/machine/cli/flagValue'
import { loadMcpManifest } from '../lib/machine/cli/loadMcpManifest'
import { resolveTargetPaths } from '../lib/machine/cli/resolveTargetPaths'
import { captureMcpManifest } from '../lib/machine/domains/mcp/capture/captureMcpManifest'
import { read } from '../lib/machine/domains/mcp/read'
import { resolveInstanceDir } from '../lib/machine/instance/resolveInstanceDir'
import { formatMcpCapture } from '../lib/machine/report/formatters/formatMcpCapture'

export const main = async () => {
  const flag = flagValue(process.argv, '--instance')
  const instanceDir = resolveInstanceDir({
    ...(flag === undefined ? {} : { flag }),
    env: process.env,
    root: ROOT,
  })

  const declared = await loadMcpManifest(instanceDir)
  const capture = captureMcpManifest({
    state: await read(resolveTargetPaths(homedir())),
    declared: declared.ok ? declared.manifest : undefined,
  })

  console.log(formatMcpCapture(capture, process.argv.includes('--json')))
}
