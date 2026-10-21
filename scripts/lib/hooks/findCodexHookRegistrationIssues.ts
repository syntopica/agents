import path from 'node:path'
import { isCodexHooksSnapshot } from './isCodexHooksSnapshot'
import type { CodexHooksSnapshot } from './types/CodexHooksSnapshot'

export const findCodexHookRegistrationIssues = (
  snapshot: CodexHooksSnapshot,
  cwd: string,
  hooksDirectory: string,
): string[] => {
  if (!isCodexHooksSnapshot(snapshot))
    return ['Codex returned an invalid hook registration snapshot.']
  const entry = snapshot.data.find((item) => item.cwd === cwd)
  if (!entry)
    return ['Codex returned no hook registration snapshot for this directory.']
  const issues = entry.errors.map(
    () => 'Codex reported a hook configuration error.',
  )
  for (const [event, filename] of [
    ['sessionStart', 'session-start-brp-reminder.sh'],
    ['userPromptSubmit', 'user-prompt-skill-router.sh'],
    ['stop', 'stop-verification-gate.sh'],
  ] as const) {
    const command = `bash ${path.join(hooksDirectory, filename)}`
    const registrations = entry.hooks.filter(
      (hook) =>
        hook.eventName === event &&
        hook.handlerType === 'command' &&
        hook.command === command &&
        !hook.matcher,
    )
    if (registrations.length === 0) {
      issues.push(`${event}: missing expected canonical command registration.`)
      continue
    }
    if (
      !registrations.some(
        (hook) =>
          hook.enabled && ['trusted', 'managed'].includes(hook.trustStatus),
      )
    ) {
      issues.push(
        `${event}: expected registration is disabled or requires trust review.`,
      )
    }
  }
  return issues
}
