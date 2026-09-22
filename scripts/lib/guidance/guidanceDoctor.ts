import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { collectAcceptedGuidanceFindings } from './collectAcceptedGuidanceFindings'
import { collectGuidanceDocumentFindings } from './collectGuidanceDocumentFindings'
import { parseGuidancePolicy } from './parseGuidancePolicy'
import { readGuidanceDocuments } from './readGuidanceDocuments'
import type { GuidancePolicy } from './types/GuidancePolicy'

export const guidanceDoctor = async (options: {
  home: string
  canonicalDir: string
  stateDir: string
}): Promise<{ ok: boolean; findings: string[] }> => {
  const findings: string[] = []
  let policy: GuidancePolicy | undefined
  try {
    const parsedPolicy = parseGuidancePolicy(
      JSON.parse(
        await readFile(join(options.canonicalDir, 'policy.json'), 'utf8'),
      ) as unknown,
    )
    if (parsedPolicy.ok) policy = parsedPolicy.policy
    else findings.push(...parsedPolicy.errors)
  } catch {
    findings.push('policy.json is missing or invalid JSON')
  }
  const documents = await readGuidanceDocuments(options)
  findings.push(...documents.findings)
  findings.push(
    ...(await collectAcceptedGuidanceFindings(
      options.stateDir,
      documents.contents,
    )),
  )
  findings.push(...collectGuidanceDocumentFindings(documents.contents, policy))
  return { ok: findings.length === 0, findings }
}
