import { main } from '../commands/libraryObserveCodex'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
