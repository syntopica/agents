import { main } from '../commands/agentDoctor'
import { reportUnexpectedFailure } from '../lib/reportUnexpectedFailure'

main().catch((error: unknown) => {
  reportUnexpectedFailure('agent doctor failed unexpectedly', error)
})
