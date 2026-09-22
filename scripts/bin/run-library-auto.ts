import { main } from '../commands/libraryAuto'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
