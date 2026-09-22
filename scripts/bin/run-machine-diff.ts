import { main } from '../commands/machineDiff'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
