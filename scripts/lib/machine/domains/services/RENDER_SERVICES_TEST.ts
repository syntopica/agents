import assert from 'node:assert/strict'
import test from 'node:test'
import { renderLaunchAgent } from '../../renderers/launchd/renderLaunchAgent'
import { renderSystemdService } from '../../renderers/systemd/renderSystemdService'
import { renderSystemdTimer } from '../../renderers/systemd/renderSystemdTimer'
import { createServiceDefinition } from './fixtures/createServiceDefinition'
import { createUnscheduledService } from './fixtures/createUnscheduledService'

void test('the launch agent expands the home directory as a shell token, not a literal path', () => {
  const rendered = renderLaunchAgent(createServiceDefinition())

  assert.match(rendered, /cd &quot;\$HOME\/p\/agents&quot;/)
  assert.equal(rendered.includes('/Users/'), false)
})

void test('shell operators are xml escaped so the plist stays parseable', () => {
  const rendered = renderLaunchAgent(createServiceDefinition())

  assert.match(rendered, /&amp;&amp;/)
  assert.equal(rendered.includes(' && '), false)
})

void test('the weekly schedule renders as a calendar interval', () => {
  const rendered = renderLaunchAgent(createServiceDefinition())

  assert.match(rendered, /<key>Weekday<\/key>\n {4}<integer>0<\/integer>/)
  assert.match(rendered, /<key>Hour<\/key>\n {4}<integer>6<\/integer>/)
})

void test('a service without a schedule renders no calendar interval', () => {
  const rendered = renderLaunchAgent(
    createUnscheduledService({ runAtLoad: true }),
  )

  assert.equal(rendered.includes('StartCalendarInterval'), false)
  assert.match(rendered, /<key>RunAtLoad<\/key>\n {2}<true\/>/)
})

void test('the same description renders a systemd unit with the systemd home specifier', () => {
  const rendered = renderSystemdService(createServiceDefinition())

  assert.match(rendered, /WorkingDirectory=%h\/p\/agents/)
  assert.equal(rendered.includes('$HOME'), false)
  assert.equal(rendered.includes('/Users/'), false)
})

void test('the same schedule renders as an OnCalendar timer', () => {
  assert.match(
    String(renderSystemdTimer(createServiceDefinition())),
    /OnCalendar=Sun \*-\*-\* 06:30:00/,
  )
})

void test('a daily schedule renders without a weekday', () => {
  const timer = renderSystemdTimer(
    createServiceDefinition({ schedule: { hour: 6, minute: 30 } }),
  )

  assert.match(String(timer), /OnCalendar=\*-\*-\* 06:30:00/)
})

void test('a service without a schedule renders no timer at all', () => {
  assert.equal(renderSystemdTimer(createUnscheduledService()), undefined)
})

void test('an interval schedule renders as StartInterval, not a calendar slot', () => {
  const rendered = renderLaunchAgent(
    createServiceDefinition({ schedule: { intervalSeconds: 21_600 } }),
  )

  assert.match(
    rendered,
    /<key>StartInterval<\/key>\n {2}<integer>21600<\/integer>/,
  )
  assert.equal(rendered.includes('StartCalendarInterval'), false)
})

void test('an interval timer also fires once after boot, so a machine that was off catches up', () => {
  const timer = String(
    renderSystemdTimer(
      createServiceDefinition({ schedule: { intervalSeconds: 21_600 } }),
    ),
  )

  assert.match(timer, /OnBootSec=21600s/)
  assert.match(timer, /OnUnitActiveSec=21600s/)
  assert.equal(timer.includes('OnCalendar'), false)
})
