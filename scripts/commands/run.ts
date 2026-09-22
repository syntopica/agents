import { spawnSync } from 'node:child_process'

export function run(
  cmd: string,
  args: string[],
  opts: Record<string, unknown> = {},
) {
  const r = spawnSync(cmd, args, {
    stdio: 'inherit',
    encoding: 'utf-8',
    ...opts,
  })
  if (r.status !== 0) {
    process.exit(r.status ?? 1)
  }

  return r
}
