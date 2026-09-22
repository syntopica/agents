import { main } from '../commands/guidanceRollback'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
