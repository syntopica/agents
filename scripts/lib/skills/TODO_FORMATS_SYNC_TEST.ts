import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

void test('brp-todo-create and brp-todo-work share an identical todo-formats contract', async () => {
  const root = path.resolve(import.meta.dirname, '../../..')
  const [create, work] = await Promise.all([
    fs.readFile(
      path.join(
        root,
        'src/skills/core/brp-todo-create/references/todo-formats.md',
      ),
      'utf8',
    ),
    fs.readFile(
      path.join(
        root,
        'src/skills/core/brp-todo-work/references/todo-formats.md',
      ),
      'utf8',
    ),
  ])
  assert.equal(
    create,
    work,
    'todo-formats.md diverged between the writer (brp-todo-create) and the reader (brp-todo-work); edit both copies identically',
  )
})
