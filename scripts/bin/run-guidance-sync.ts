import { main } from '../commands/guidanceSync'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
