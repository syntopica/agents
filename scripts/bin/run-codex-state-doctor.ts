import { main } from '../commands/codexStateDoctor'
import { reportUnexpectedFailure } from '../lib/reportUnexpectedFailure'

main().catch((error: unknown) => {
  reportUnexpectedFailure('Codex state doctor failed unexpectedly', error)
})
