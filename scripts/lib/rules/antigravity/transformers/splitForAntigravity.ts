/**
 * Split content if it exceeds Antigravity's 12,000 character limit
 * @param {string} content - Rule content
 * @param {string} ruleName - Rule name for splitting
 * @returns {Array<{name: string, content: string}>} - Split rules or original
 */
export function splitForAntigravity(content: string, ruleName: string) {
  const MAX_LENGTH = 12000
  if (content.length <= MAX_LENGTH) {
    return [{ name: ruleName, content }]
  }

  const sections = content.split(/(?=\n## )/g)
  const parts = []
  let currentPart: string[] = []
  let currentLength = 0
  let partIndex = 1
  for (const section of sections) {
    if (currentLength + section.length > MAX_LENGTH && currentPart.length > 0) {
      // Finalize current part
      parts.push({
        name: `${ruleName}-part${String(partIndex)}`,
        content: currentPart.join(''),
      })
      currentPart = [section]
      currentLength = section.length
      partIndex++
    } else {
      currentPart.push(section)
      currentLength += section.length
    }
  }

  if (currentPart.length > 0) {
    parts.push({
      name: partIndex > 1 ? `${ruleName}-part${String(partIndex)}` : ruleName,
      content: currentPart.join(''),
    })
  }

  return parts
}
