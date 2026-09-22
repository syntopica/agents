import { main } from '../commands/codexStateRepair'
import { reportUnexpectedFailure } from '../lib/reportUnexpectedFailure'

main().catch((error: unknown) => {
  reportUnexpectedFailure('Codex state repair failed unexpectedly', error)
})
