export const readBoundedResponseText = async (
  response: Response,
  maxBytes: number,
) => {
  if (response.body === null) return ''
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  while (size < maxBytes) {
    const next = await reader.read()
    if (next.done) break
    const value = next.value as Uint8Array
    const remaining = maxBytes - size
    const chunk = value.subarray(0, remaining)
    chunks.push(chunk)
    size += chunk.byteLength
    if (chunk.byteLength < value.byteLength) {
      await reader.cancel()
      break
    }
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(bytes)
}
