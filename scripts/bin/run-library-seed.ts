import { main } from '../commands/librarySeed'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
