export const scanJsonEnd = (text: string, start: number) => {
  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < text.length; index++) {
    const character = text[index]

    if (escaped) {
      escaped = false
    } else if (character === '\\') {
      escaped = true
    } else if (character === '"') {
      inString = !inString
    } else if (!inString && character === '{') {
      depth++
    } else if (!inString && character === '}') {
      depth--

      if (depth === 0) {
        return index
      }
    }
  }

  return undefined
}
