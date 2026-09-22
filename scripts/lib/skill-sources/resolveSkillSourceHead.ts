import { spawnSync } from 'node:child_process'

export const resolveSkillSourceHead = (source: string): string | undefined => {
  const result = spawnSync(
    'git',
    ['ls-remote', `https://github.com/${source}.git`, 'HEAD'],
    {
      encoding: 'utf8',
      stdio: 'pipe',
    },
  )
  if (result.status !== 0) return undefined
  const sha = result.stdout.trim().split(/\s+/)[0]
  return /^[a-f0-9]{40}$/.test(sha ?? '') ? sha : undefined
}
