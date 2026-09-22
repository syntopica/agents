import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createSqliteDatabase } from './fixtures/createSqliteDatabase'
import { runSqliteIntegrityCheck } from './runSqliteIntegrityCheck'

void test('a valid SQLite database passes integrity inspection', async () => {
  const root = await mkdtemp(join(tmpdir(), 'codex-sqlite-ok-'))
  const path = join(root, 'state.sqlite')
  await createSqliteDatabase(path)

  const result = await runSqliteIntegrityCheck(path)

  assert.equal(result.status, 'ok')
  assert.equal(result.summary, 'integrity check passed')
})

void test('a plain-text database is reported as corrupt', async () => {
  const root = await mkdtemp(join(tmpdir(), 'codex-sqlite-corrupt-'))
  const path = join(root, 'memories.sqlite')
  await writeFile(path, 'this is not sqlite')

  const result = await runSqliteIntegrityCheck(path)

  assert.equal(result.status, 'corrupt')
})

void test('a missing optional database is reported without being created', async () => {
  const root = await mkdtemp(join(tmpdir(), 'codex-sqlite-missing-'))
  const path = join(root, 'optional.sqlite')

  const result = await runSqliteIntegrityCheck(path)

  assert.equal(result.status, 'missing')
})
