import { stripQuotes } from '../transformers/stripQuotes'

export const parseDescription = (frontmatterRaw: string) => {
  const lines = frontmatterRaw.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (!line?.startsWith('description:')) continue

    const initial = line.replace(/^description:\s*/, '').trim()
    if (initial.length > 0) return stripQuotes(initial)

    const values = []
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j]
      if (!next || /^[A-Za-z0-9_-]+:\s*/.test(next)) break
      if (next.trim().length === 0) break
      values.push(next.trim())
    }

    return values.join(' ').trim()
  }

  return ''
}
