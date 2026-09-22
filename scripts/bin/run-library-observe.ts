import { main } from '../commands/libraryObserve'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
