import { main } from '../commands/libraryCurate'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
