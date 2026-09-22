import { main } from '../commands/machineCapturePlugins'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
