import { INSTALL_HINT } from '../constants/INSTALL_HINT'
import { method } from '../constants/method'
import { result } from '../constants/result'
import { skillDirs } from '../constants/skillDirs'

export const main = () => {
  if (skillDirs.length === 0) {
    console.error('No skill directories found under dist/skills/')
    process.exit(1)
  }
  if (!method) {
    console.error('skills-ref to-prompt not found.' + INSTALL_HINT)
    process.exit(1)
  }
  if (result.status !== 0) {
    if (result.stderr) console.error(result.stderr.trim())
    process.exit(result.status ?? 1)
  }
}
