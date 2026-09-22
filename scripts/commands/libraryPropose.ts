import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { buildSkillKeyIndex } from '../lib/library/buildSkillKeyIndex'
import { listSkillPaths } from '../lib/library/cli/listSkillPaths'
import { readCurationManifest } from '../lib/library/cli/readCurationManifest'
import { readSkillDescription } from '../lib/library/cli/readSkillDescription'
import { resolveLibraryDir } from '../lib/library/cli/resolveLibraryDir'
import { formatProposals } from '../lib/library/formatters/formatProposals'
import { guessCoveringSkill } from '../lib/library/learning/guessCoveringSkill'
import { mergeInvocationCounts } from '../lib/library/learning/mergeInvocationCounts'
import { parseProceduresFile } from '../lib/library/learning/parseProceduresFile'
import { proposeChanges } from '../lib/library/learning/proposeChanges'
import { readInvocationCounts } from '../lib/library/learning/readInvocationCounts'
import type { SkillCatalogEntry } from '../lib/library/learning/types/SkillCatalogEntry'
import { flagValue } from '../lib/machine/cli/flagValue'

export const main = async () => {
  const home = homedir()
  const asJson = process.argv.includes('--json')
  const libraryFlag = flagValue(process.argv, '--library')
  const proceduresPath = flagValue(process.argv, '--procedures')

  if (proceduresPath === undefined) {
    console.error('usage: library:propose --procedures <file.json> [--json]')
    process.exitCode = 1
    return
  }

  const libraryDir = resolveLibraryDir({
    ...(libraryFlag === undefined ? {} : { flag: libraryFlag }),
    env: process.env,
    home,
  })

  const parsed = await readCurationManifest(libraryDir)

  if (!parsed.ok) {
    console.error(parsed.errors.join('\n'))
    process.exitCode = 1
    return
  }

  let procedures
  try {
    procedures = parseProceduresFile(
      JSON.parse(await fs.readFile(proceduresPath, 'utf8')) as unknown,
    )
  } catch {
    console.error(`cannot read procedures from ${proceduresPath}`)
    process.exitCode = 1
    return
  }

  // Codex reads count as usage: without them a skill this machine only uses
  // from Codex reads as idle and gets proposed for parking.
  const invocations = mergeInvocationCounts([
    await readInvocationCounts(
      join(libraryDir, 'learning', 'invocations.json'),
    ),
    await readInvocationCounts(
      join(libraryDir, 'learning', 'codex-reads.json'),
    ),
  ])

  const catalog: SkillCatalogEntry[] = []
  for (const [key, entry] of Object.entries(parsed.manifest.entries)) {
    if (key.startsWith('rules/')) {
      continue
    }
    const description = await readSkillDescription(
      join(libraryDir, 'skills', key),
    )
    catalog.push({
      key,
      text: [key, description ?? '', ...(entry.triggers ?? [])].join(' '),
    })
  }

  const proposals = proposeChanges({
    procedures,
    manifest: parsed.manifest,
    invocations,
    target: flagValue(process.argv, '--target') ?? 'claude',
    keyIndex: buildSkillKeyIndex(
      Object.keys(parsed.manifest.entries),
      await listSkillPaths(libraryDir),
    ),
  })

  const annotated = proposals.map((proposal) => {
    if (proposal.kind !== 'build' || proposal.procedure === undefined) {
      return proposal
    }
    const guess = guessCoveringSkill(proposal.procedure, catalog)
    if (guess === undefined) {
      return proposal
    }
    return {
      ...proposal,
      why: `${proposal.why}; closest installed skill: ${guess.skill} (${guess.score.toFixed(2)})`,
    }
  })

  console.log(formatProposals(annotated, asJson))
}
