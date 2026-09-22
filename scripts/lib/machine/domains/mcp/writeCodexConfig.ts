import { promises as fs } from 'node:fs'
import { readFileOrEmpty } from './readFileOrEmpty'
import { stripOwnedTomlBlocks } from './stripOwnedTomlBlocks'
import type { WriteCodexConfigInput } from './types/WriteCodexConfigInput'

export const writeCodexConfig = async ({
  path,
  toml,
  ownedNames,
  renderedNames,
}: WriteCodexConfigInput) => {
  const contents = await readFileOrEmpty(path)
  const body = stripOwnedTomlBlocks(
    contents,
    new Set([...ownedNames, ...renderedNames]),
  )
  const rendered = toml.trim()

  await fs.writeFile(
    path,
    rendered === '' ? `${body}\n` : `${body}\n\n${rendered}\n`,
  )

  return renderedNames
}
