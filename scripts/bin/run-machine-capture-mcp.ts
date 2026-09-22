import { main } from '../commands/machineCaptureMcp'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
