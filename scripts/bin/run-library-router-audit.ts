import { main } from '../commands/libraryRouterAudit'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
