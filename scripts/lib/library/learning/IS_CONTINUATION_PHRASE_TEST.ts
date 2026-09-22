import assert from 'node:assert/strict'
import test from 'node:test'
import { isContinuationPhrase } from './isContinuationPhrase'

void test('a bare approval is not a trigger', () => {
  assert.equal(isContinuationPhrase('adelante'), true)
  assert.equal(isContinuationPhrase('Adelante con todo'), true)
  assert.equal(isContinuationPhrase('continue'), true)
})

void test('a bare number chosen from a menu is not a trigger', () => {
  assert.equal(isContinuationPhrase('1'), true)
})

void test('a blanket instruction with no subject is not a trigger', () => {
  assert.equal(isContinuationPhrase('arregla todo eso'), true)
})

void test('a request naming what to do is a trigger', () => {
  assert.equal(
    isContinuationPhrase('arregla el header en movil, se ve mal'),
    false,
  )
})

void test('a request about invoices is a trigger', () => {
  assert.equal(
    isContinuationPhrase(
      'revisa todas las recurrentes del portal y su plantilla',
    ),
    false,
  )
})

void test('anything too short to carry a subject is not a trigger', () => {
  assert.equal(isContinuationPhrase('como va?'), true)
})

void test('pasted image metadata is not a phrase a description could ever reflect', () => {
  assert.equal(
    isContinuationPhrase('[Image: original 3456x2234, displayed at 2000x1293.'),
    true,
  )
})
