import { main } from '../commands/codexSessionRestore'
import { reportUnexpectedFailure } from '../lib/reportUnexpectedFailure'

main().catch((error: unknown) => {
  reportUnexpectedFailure('Codex session restore failed unexpectedly', error)
})
