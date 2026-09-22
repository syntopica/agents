import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { resolveLearningDir } from '../lib/library/cli/resolveLearningDir'
import { aggregateProcedures } from '../lib/library/learning/aggregateProcedures'
import { chunkRequests } from '../lib/library/learning/chunkRequests'
import { parseClassifierOutput } from '../lib/library/learning/parseClassifierOutput'
import { runClassifier } from '../lib/library/learning/runClassifier'
import { flagValue } from '../lib/machine/cli/flagValue'

export const main = async () => {
  const home = homedir()
  const command = flagValue(process.argv, '--command')

  if (command === undefined) {
    console.error(
      "usage: library:classify --command '<cmd>' [--batch 160] [--min 2]\n" +
        'the command runs once per batch with LIBRARY_BATCH set to a file holding one request\n' +
        'per line, and must print JSON of the shape { requests: [{ procedure, project }] }',
    )
    process.exitCode = 1
    return
  }

  const learningFlag = flagValue(process.argv, '--learning')
  const learningDir = resolveLearningDir({
    ...(learningFlag === undefined ? {} : { flag: learningFlag }),
    env: process.env,
    home,
  })

  let lines: string[]
  try {
    lines = (await fs.readFile(join(learningDir, 'requests.jsonl'), 'utf8'))
      .split('\n')
      .filter((line) => line.trim() !== '')
  } catch {
    console.error(
      `no requests.jsonl under ${learningDir}; run library:observe first`,
    )
    process.exitCode = 1
    return
  }

  const requests: string[] = []
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as { text?: unknown }
      if (typeof parsed.text === 'string' && parsed.text.trim() !== '') {
        requests.push(parsed.text.replaceAll('\n', ' '))
      }
    } catch {
      continue
    }
  }

  const perBatch = Number(flagValue(process.argv, '--batch') ?? '160')
  const batches = chunkRequests(requests, perBatch)
  const batchDir = join(learningDir, 'batches')
  await fs.mkdir(batchDir, { recursive: true })

  const anchorsPath = join(learningDir, 'procedure-anchors.txt')
  try {
    const previous = JSON.parse(
      await fs.readFile(join(learningDir, 'procedures.json'), 'utf8'),
    ) as { name?: unknown }[]
    const anchors = previous
      .map((item) => item.name)
      .filter((name): name is string => typeof name === 'string')
      .slice(0, 100)
    await fs.writeFile(anchorsPath, `${anchors.join('\n')}\n`)
  } catch {
    await fs.writeFile(anchorsPath, '')
  }

  const classified: { procedure: string; project?: string }[] = []
  let failed = 0

  for (const [index, batch] of batches.entries()) {
    const batchPath = join(batchDir, `batch-${String(index + 1)}.txt`)
    await fs.writeFile(batchPath, `${batch.join('\n')}\n`)

    const parsed = parseClassifierOutput(
      await runClassifier(command, batchPath, anchorsPath),
    )

    if (parsed.length === 0) {
      failed++
      console.error(`batch ${String(index + 1)} returned nothing usable`)
      continue
    }

    classified.push(...parsed)
  }

  const procedures = aggregateProcedures(
    classified,
    Number(flagValue(process.argv, '--min') ?? '2'),
  )
  await fs.writeFile(
    join(learningDir, 'procedures.json'),
    `${JSON.stringify(procedures, null, 1)}\n`,
  )

  console.log(
    [
      `requests classified: ${String(classified.length)} of ${String(requests.length)}`,
      `batches that returned nothing: ${String(failed)} of ${String(batches.length)}`,
      `procedures written: ${String(procedures.length)}`,
    ].join('\n'),
  )

  if (failed > 0) {
    process.exitCode = 1
  }
}
