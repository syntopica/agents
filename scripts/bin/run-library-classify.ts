import { main } from '../commands/libraryClassify'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
