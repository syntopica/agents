import { main } from '../commands/compileRules'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
