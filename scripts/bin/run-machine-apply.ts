import { main } from '../commands/machineApply'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
