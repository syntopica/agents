import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { writeLoopReport } from './writeLoopReport'

void test('the report is dated, sectioned, and returns its own path', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'library-report-'))
  const path = await writeLoopReport(dir, '2026-08-18', [
    { title: 'Observe', body: 'requests: 4100' },
    { title: 'Propose', body: '' },
  ])
  assert.match(path, /2026-08-18-library-loop\.md$/)
  const contents = await readFile(path, 'utf8')
  assert.match(contents, /# Library loop report - 2026-08-18/)
  assert.match(contents, /## Observe\n\nrequests: 4100/)
  assert.match(contents, /## Propose\n\n\(no output\)/)
})
