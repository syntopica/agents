import { IDE_RULE_TARGETS } from '../lib/link/constants/IDE_RULE_TARGETS'
import { applyCapabilityLinks } from '../lib/machine/domains/capabilities/applyCapabilityLinks'
import { formatCapabilityApplyResult } from '../lib/machine/domains/capabilities/formatters/formatCapabilityApplyResult'

export const main = async () => {
  let linked = 0
  let skipped = 0

  for (const ruleTarget of IDE_RULE_TARGETS) {
    const result = await applyCapabilityLinks({
      id: ruleTarget.ide.id,
      capability: 'rules',
      support: 'supported',
      detectPaths:
        ruleTarget.ide.detectPaths ??
        (ruleTarget.ide.rootDir ? [ruleTarget.ide.rootDir] : []),
      cleanup: ruleTarget.cleanup === undefined ? [] : [ruleTarget.cleanup],
      links: ruleTarget.links,
    })
    if (result.status === 'unavailable') {
      console.log(`- ${ruleTarget.ide.id}: skipped (not installed)`)
      skipped++
      continue
    }

    console.log(
      `+ ${ruleTarget.ide.id}: ${formatCapabilityApplyResult(result)}`,
    )
    linked++
  }

  console.log(
    `\nDone: rules linked to ${String(linked)} IDEs` +
      (skipped > 0 ? ` (${String(skipped)} skipped)` : ''),
  )
}
