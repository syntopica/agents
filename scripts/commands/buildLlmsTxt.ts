import { relative } from 'node:path'
import { ROOT } from '../constants/ROOT'

export function buildLlmsTxt(
  skills: { name: string; description: string; skillPath: string }[],
) {
  const lines = [
    '# BusiRocket Agent Skills',
    '',
    'A collection of reusable Agent Skills for TypeScript/React/Next.js/Rust/Tauri projects. Skills follow the Agent Skills format (https://agentskills.io/specification).',
    '',
    '## Skills',
    '',
  ]
  for (const { name, description, skillPath } of skills) {
    const relativePath = relative(ROOT, skillPath).replace(/\\/g, '/')
    lines.push(`- ${name}: ${description}`)
    lines.push(`  ${relativePath}/SKILL.md`)
    lines.push('')
  }

  lines.push('## Links')
  lines.push('')
  lines.push(
    '- [Agent Skills specification](https://agentskills.io/specification)',
  )
  lines.push(
    '- [Integrate skills into your agent](https://agentskills.io/integrate-skills)',
  )
  lines.push('')
  return lines.join('\n')
}
