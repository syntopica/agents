import { main } from '../commands/compileSkills'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
