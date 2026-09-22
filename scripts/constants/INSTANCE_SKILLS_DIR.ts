/**
 * An optional second source of skills, outside this repository.
 *
 * Some skills are instance data: they encode one person's mailboxes, job
 * search or estate, and they are the reason this repository could not be
 * published. `AGENTS_INSTANCE_SKILLS_DIR` points at a private directory laid
 * out exactly like `src/skills` -- skill directories plus a
 * `skill-rules.map.json` fragment -- and the compiler reads both roots.
 * Unset, the engine compiles only what it ships, which is what a clone gets.
 */
export const INSTANCE_SKILLS_DIR = process.env['AGENTS_INSTANCE_SKILLS_DIR']
