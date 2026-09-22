import { main } from '../commands/compilePlugins'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
