import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

void test('the agent-ready standard bundled into brp-code-quality matches docs/', async () => {
  const root = path.resolve(import.meta.dirname, '../../..')
  const skillRefs = 'src/skills/core/brp-code-quality/references'
  const pairs: [string, string][] = [
    [
      'docs/agent-ready-repo-standard.md',
      `${skillRefs}/agent-ready-standard.md`,
    ],
    ['docs/templates/AGENTS.template.md', `${skillRefs}/AGENTS.template.md`],
  ]
  for (const [docPath, refPath] of pairs) {
    const [doc, ref] = await Promise.all([
      fs.readFile(path.join(root, docPath), 'utf8'),
      fs.readFile(path.join(root, refPath), 'utf8'),
    ])
    // The bundled copy rewrites the template link to its own directory; normalize
    // that one deliberate difference before comparing.
    const normalizedDoc = doc.replace(
      '[templates/AGENTS.template.md](templates/AGENTS.template.md)',
      '[AGENTS.template.md](AGENTS.template.md)',
    )
    assert.equal(
      ref,
      normalizedDoc,
      `${refPath} diverged from ${docPath}; update the bundled copy when the doc changes`,
    )
  }
})
