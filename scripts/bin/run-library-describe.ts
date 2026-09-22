import { main } from '../commands/libraryDescribe'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
