import { chmod, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const createProbeExecutable = async (body: string): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'live-probe-'))
  const command = join(directory, 'probe')
  await writeFile(command, `#!/bin/sh\n${body}\n`)
  await chmod(command, 0o755)
  return command
}
