import { main } from '../commands/libraryTriggers'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
