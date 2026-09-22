import { main } from '../commands/libraryLoop'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
