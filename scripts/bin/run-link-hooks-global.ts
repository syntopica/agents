import { main } from '../commands/linkHooksGlobal'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
