import { main } from '../commands/codexSessionArchive'
import { reportUnexpectedFailure } from '../lib/reportUnexpectedFailure'

main().catch((error: unknown) => {
  reportUnexpectedFailure('Codex session archive failed unexpectedly', error)
})
