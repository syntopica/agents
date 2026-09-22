import { scanJsonEnd } from './scanJsonEnd'

export const firstJsonObject = (text: string) => {
  const start = text.indexOf('{')

  if (start === -1) {
    return undefined
  }

  const end = scanJsonEnd(text, start)

  return end === undefined ? undefined : text.slice(start, end + 1)
}
