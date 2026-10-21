import { main } from '../commands/hookDoctor'
import { reportUnexpectedFailure } from '../lib/reportUnexpectedFailure'

main().catch((error: unknown) => {
  reportUnexpectedFailure('hook doctor failed unexpectedly', error)
})
