import { existsSync, rmSync } from 'node:fs'
import { VENV_DIR } from '../../constants/VENV_DIR'

export const main = () => {
  if (!existsSync(VENV_DIR)) {
    console.log('No .venv-validate found. Nothing to remove.')
    process.exit(0)
  }
  rmSync(VENV_DIR, { recursive: true })
  console.log('Removed .venv-validate')
}
