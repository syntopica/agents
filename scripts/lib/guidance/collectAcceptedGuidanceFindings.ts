import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseAcceptedGuidanceState } from './parseAcceptedGuidanceState'
import { sha256Text } from './sha256Text'
import type { GuidanceDocumentContents } from './types/GuidanceDocumentContents'

export const collectAcceptedGuidanceFindings = async (
  stateDir: string,
  contents: GuidanceDocumentContents,
): Promise<string[]> => {
  let accepted: ReturnType<typeof parseAcceptedGuidanceState>
  try {
    accepted = parseAcceptedGuidanceState(
      JSON.parse(
        await readFile(join(stateDir, 'accepted.json'), 'utf8'),
      ) as unknown,
    )
  } catch {
    return ['no valid accepted guidance run']
  }
  if (!accepted.ok) return [accepted.error]
  const findings: string[] = []
  for (const name of Object.keys(
    contents,
  ) as (keyof GuidanceDocumentContents)[]) {
    const content = contents[name]
    if (
      content !== undefined &&
      sha256Text(content) !== accepted.state.outputHashes[name]
    )
      findings.push(`guidance drift detected: ${name}`)
  }
  return findings
}
