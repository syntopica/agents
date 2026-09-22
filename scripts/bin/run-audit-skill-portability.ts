import { main } from '../commands/auditSkillPortability'
import { reportUnexpectedFailure } from '../lib/reportUnexpectedFailure'

main().catch((error: unknown) => {
  reportUnexpectedFailure('skill portability audit failed unexpectedly', error)
})
