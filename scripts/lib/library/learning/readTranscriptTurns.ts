import { collectSkillInvocations } from './collectSkillInvocations'
import { extractTurnText } from './extractTurnText'
import { isMachineTurn } from './isMachineTurn'
import type { ObservedTurn } from './types/ObservedTurn'

export const readTranscriptTurns = (contents: string) => {
  const turns: ObservedTurn[] = []

  for (const line of contents.split('\n')) {
    if (line.trim() === '') {
      continue
    }

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(line) as Record<string, unknown>
    } catch {
      continue
    }

    const message = parsed['message'] as { content?: unknown } | undefined
    if (message === undefined) {
      continue
    }

    if (parsed['type'] === 'assistant') {
      turns.push(...collectSkillInvocations(message.content))
      continue
    }

    if (parsed['type'] !== 'user' || parsed['isSidechain'] === true) {
      continue
    }

    const text = extractTurnText(message.content).trim()
    if (text === '' || isMachineTurn(text)) {
      continue
    }

    turns.push({ text })
  }

  return turns
}
