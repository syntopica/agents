import { spawnSync } from 'node:child_process'
import { VENV_CLI } from '../constants/VENV_CLI'

export function runToPrompt(skillPaths: string[], method: string) {
  const args = ['to-prompt', ...skillPaths]
  if (method === 'venv') {
    return spawnSync(VENV_CLI, args, {
      stdio: ['inherit', 'inherit', 'pipe'],
      encoding: 'utf-8',
    })
  }

  if (method === 'pipx') {
    return spawnSync(
      'pipx',
      ['run', 'skills-ref', 'to-prompt', ...skillPaths],
      {
        stdio: ['inherit', 'inherit', 'pipe'],
        encoding: 'utf-8',
        shell: true,
      },
    )
  }

  return spawnSync('skills-ref', args, {
    stdio: ['inherit', 'inherit', 'pipe'],
    encoding: 'utf-8',
    shell: true,
  })
}
