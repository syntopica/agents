import path from 'node:path'
import { SRC_SKILLS_DIR } from '../../../constants/SRC_SKILLS_DIR'
import { listSkillDirs } from './listSkillDirs'

/**
 * The names of the skills this repository ships, ignoring any private root.
 *
 * `llms.txt` is tracked, so it must describe the engine and nothing else. It
 * is generated from the compiled output, which on a machine with a private
 * skills root also contains that machine's own skills -- and their
 * descriptions say what mailbox and what job search they are for. Filtering
 * by what exists in `src/skills` keeps the published file a property of the
 * repository rather than of whoever last ran the build.
 */
export const listEngineSkillNames = async (): Promise<Set<string>> => {
  const dirs = await listSkillDirs(SRC_SKILLS_DIR)

  return new Set(dirs.map((dir) => path.basename(dir)))
}
