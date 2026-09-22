import { main } from '../commands/guidanceDoctor'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
