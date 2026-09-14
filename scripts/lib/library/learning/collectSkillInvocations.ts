import type { ObservedTurn } from './types/ObservedTurn'

export const collectSkillInvocations = (content: unknown): ObservedTurn[] => {
  if (!Array.isArray(content)) {
    return []
  }

  const turns: ObservedTurn[] = []

  for (const block of content) {
    if (typeof block !== 'object' || block === null) {
      continue
    }

    const record = block as Record<string, unknown>
    if (record['type'] !== 'tool_use' || record['name'] !== 'Skill') {
      continue
    }

    const input = record['input'] as { skill?: unknown } | undefined
    if (typeof input?.skill === 'string') {
      turns.push({ text: '', invokedSkill: input.skill })
    }
  }

  return turns
}
