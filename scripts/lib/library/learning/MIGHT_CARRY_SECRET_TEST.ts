import assert from 'node:assert/strict'
import test from 'node:test'
import { mightCarrySecret } from './mightCarrySecret'

void test('a pasted password-shaped string is caught', () => {
  assert.equal(
    mightCarrySecret('no me deja entrar, los datos son Kd%L6zwCMuo&p2As96s'),
    true,
  )
})

void test('a labelled credential is caught even when the value is plain', () => {
  assert.equal(mightCarrySecret('la contraseña: hunter2000'), true)
})

void test('a token prefix is caught', () => {
  assert.equal(
    mightCarrySecret('usa ghp_0000000000000000000000000000000000'),
    true,
  )
})

void test('a connection string with inline credentials is caught', () => {
  assert.equal(mightCarrySecret('mongodb+srv://user:pass@cluster/'), true)
})

void test('an ordinary request is not flagged', () => {
  assert.equal(mightCarrySecret('arregla el header en movil, se ve mal'), false)
})

void test('a request mentioning a file path is not flagged', () => {
  assert.equal(
    mightCarrySecret('revisa /Users/someone/p/project/src/index.ts'),
    false,
  )
})
