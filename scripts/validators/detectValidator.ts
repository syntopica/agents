import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { VENV_VALIDATOR } from '../constants/VENV_VALIDATOR'

export const detectValidator = (firstSkillPath: string) => {
  if (existsSync(VENV_VALIDATOR)) {
    const r = spawnSync(VENV_VALIDATOR, ['validate', firstSkillPath], {
      stdio: 'pipe',
      encoding: 'utf-8',
    })
    if (r.status === 0) return 'venv'
  }

  const pipx = spawnSync(
    'pipx',
    ['run', 'skills-ref', 'validate', firstSkillPath],
    {
      stdio: 'pipe',
      encoding: 'utf-8',
      shell: true,
    },
  )
  if (pipx.status === 0) return 'pipx'

  const global = spawnSync('skills-ref', ['validate', firstSkillPath], {
    stdio: 'pipe',
    encoding: 'utf-8',
    shell: true,
  })
  if (global.status === 0) return 'path'

  return null
}
