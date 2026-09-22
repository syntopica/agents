import { main } from '../commands/libraryPropose'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
