import { main } from '../commands/linkSkillsGlobal'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
