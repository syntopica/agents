import assert from 'node:assert/strict'
import test from 'node:test'
import { expandHomePlaceholder } from './expandHomePlaceholder'

void test('expands $HOME, ${HOME} and a leading tilde', () => {
  assert.equal(expandHomePlaceholder('$HOME/p/x', '/h'), '/h/p/x')
  assert.equal(expandHomePlaceholder('${HOME}/p/x', '/h'), '/h/p/x')
  assert.equal(expandHomePlaceholder('~/p/x', '/h'), '/h/p/x')
})

void test('leaves a tilde inside a path and an unrelated string alone', () => {
  assert.equal(expandHomePlaceholder('/opt/a~b', '/h'), '/opt/a~b')
  assert.equal(expandHomePlaceholder('atrium-mcp', '/h'), 'atrium-mcp')
})
