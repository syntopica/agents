import { main } from '../commands/machineRollback'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
