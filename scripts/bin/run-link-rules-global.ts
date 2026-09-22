import { main } from '../commands/linkRulesGlobal'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
