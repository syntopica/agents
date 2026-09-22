import assert from 'node:assert/strict'
import test from 'node:test'
import { selectRecurringTriggers } from './selectRecurringTriggers'

void test("a phrase sharing vocabulary with the skill's other phrases is kept", () => {
  const { kept } = selectRecurringTriggers({
    'core/invoice-quarter-close': [
      'revisa las facturas recurrentes del portal',
      'mira las facturas del trimestre en el portal',
    ],
  })
  assert.equal(kept['core/invoice-quarter-close']?.length, 2)
})

void test('a stray phrase with no shared vocabulary is dropped, not learned', () => {
  const { kept, dropped } = selectRecurringTriggers({
    'frontend-design': [
      'el header se ve mal en movil, arregla el design',
      'revisa el design del layout de la landing',
      'dame un PDF de contrarider para enviar',
    ],
  })
  const droppedList = dropped['frontend-design']
  assert.ok(droppedList)
  assert.equal(droppedList.length, 1)
  assert.match(droppedList[0] ?? '', /contrarider/)
  assert.equal(kept['frontend-design']?.length, 2)
})

void test('a single phrase naming the skill is enough on its own', () => {
  const { kept } = selectRecurringTriggers({
    codex: ['si vas a quemar cuota usa codex para eso'],
  })
  assert.equal(kept['codex']?.length, 1)
})

void test('a single phrase that does not name the skill is unconfirmed and dropped', () => {
  const { dropped } = selectRecurringTriggers({
    'computer-use': ['ahora no carga ningun archivo en el player'],
  })
  assert.equal(dropped['computer-use']?.length, 1)
})
