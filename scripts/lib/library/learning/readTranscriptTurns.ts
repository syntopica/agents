import { collectSkillInvocations } from './collectSkillInvocations'
import { extractTurnText } from './extractTurnText'
import { isMachineTurn } from './isMachineTurn'
import type { ObservedTurn } from './types/ObservedTurn'
import type { ReadTranscriptTurnsMessage } from './types/ReadTranscriptTurnsMessage'

export const readTranscriptTurns = (contents: string) => {
  const turns: ObservedTurn[] = []

  for (const line of contents.split('\n')) {
    if (line.trim() === '') {
      continue
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(line)
    } catch {
      continue
    }

    if (typeof parsed !== 'object' || parsed === null) {
      continue
    }

    const record = parsed as Record<string, unknown>
    const rawMessage = record['message']
    if (typeof rawMessage !== 'object' || rawMessage === null) {
      continue
    }
    const message = rawMessage as ReadTranscriptTurnsMessage

    if (record['type'] === 'assistant') {
      turns.push(...collectSkillInvocations(message.content))
      continue
    }

    if (record['type'] !== 'user' || record['isSidechain'] === true) {
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
