import { main } from '../commands/connectorDoctor'
import { reportUnexpectedFailure } from '../lib/reportUnexpectedFailure'

main().catch((error: unknown) => {
  reportUnexpectedFailure('connector doctor failed unexpectedly', error)
})
