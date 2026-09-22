import { main } from '../commands/libraryLink'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
