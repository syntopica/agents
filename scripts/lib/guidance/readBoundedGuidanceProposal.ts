import type { FileHandle } from 'node:fs/promises'

export const readBoundedGuidanceProposal = async (
  handle: FileHandle,
  byteLimit: number,
): Promise<string> => {
  const buffer = Buffer.alloc(byteLimit + 1)
  let length = 0
  while (length < buffer.length) {
    const chunk = await handle.read(
      buffer,
      length,
      buffer.length - length,
      null,
    )
    if (chunk.bytesRead === 0) break
    length += chunk.bytesRead
  }
  if (length > byteLimit)
    throw new Error('proposal exceeds the serialized byte limit')
  return buffer.subarray(0, length).toString('utf8')
}
