import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { findCodexHookRegistrationIssues } from './findCodexHookRegistrationIssues'
import { findStaleLinkedHooks } from './findStaleLinkedHooks'
import { findUnreachableHooks } from './findUnreachableHooks'
import { inspectInstalledCodexHooks } from './inspectInstalledCodexHooks'
import { isCodexHooksSnapshot } from './isCodexHooksSnapshot'
import { readCodexHooksSnapshot } from './readCodexHooksSnapshot'
import type { CodexHooksSnapshot } from './types/CodexHooksSnapshot'

void test('native hook transport kills children that ignore SIGTERM on success and timeout', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'hooks-stubborn-'))
  const executable = path.join(directory, 'codex-fixture')
  const pidPath = path.join(directory, 'pid')
  try {
    for (const respond of [true, false]) {
      await writeFile(
        executable,
        `#!/usr/bin/env node
require('node:fs').writeFileSync(${JSON.stringify(pidPath)}, String(process.pid));
process.on('SIGTERM', () => {});
setInterval(() => {}, 1000);
require('node:readline').createInterface({input:process.stdin}).on('line', line => {
 const request = JSON.parse(line);
 if (request.method === 'initialize') console.log(JSON.stringify({id:1,result:{}}));
 if (request.method === 'hooks/list' && ${String(respond)}) console.log(JSON.stringify({id:2,result:{data:[]}}));
});
`,
        { mode: 0o700 },
      )
      const operation = readCodexHooksSnapshot('/project', executable, 1500)
      if (respond) assert.deepEqual(await operation, { data: [] })
      else await assert.rejects(operation, /timed out/)
      const pid = Number(await readFile(pidPath, 'utf8'))
      await new Promise((resolve) => setTimeout(resolve, 500))
      assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' })
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

void test('native hook snapshot rejects malformed nested handler fields', () => {
  for (const enabled of ['false', 0, null]) {
    assert.equal(
      isCodexHooksSnapshot({
        data: [
          {
            cwd: '/project',
            errors: [],
            warnings: [],
            hooks: [
              {
                eventName: 'stop',
                handlerType: 'command',
                command: 'x',
                enabled,
                trustStatus: 'trusted',
              },
            ],
          },
        ],
      }),
      false,
    )
  }
  for (const data of [
    null,
    [{}],
    [{ cwd: '/project', hooks: [], errors: {}, warnings: [] }],
  ]) {
    assert.equal(isCodexHooksSnapshot({ data }), false)
  }
})

void test('native hook transport rejects failures without exposing native payloads', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'hooks-protocol-'))
  const executable = path.join(directory, 'codex-fixture')
  try {
    for (const mode of [
      'success',
      'error',
      'invalid',
      'exit',
      'order',
      'large-frame',
      'large-stream',
    ]) {
      await writeFile(
        executable,
        `#!/usr/bin/env node
const readline = require('node:readline');
if (${JSON.stringify(mode)} === 'order') console.log(JSON.stringify({id:2,result:{data:[]}}));
readline.createInterface({input:process.stdin}).on('line', line => {
 const request = JSON.parse(line);
 if (request.method === 'initialize') console.log(JSON.stringify({id:1,result:{}}));
 else if (request.method === 'initialized') return;
 else if (request.method !== 'hooks/list') process.exit(2);
 else if (${JSON.stringify(mode)} === 'exit') process.exit(0);
 else if (${JSON.stringify(mode)} === 'error') console.log(JSON.stringify({id:2,error:{message:'private fixture detail'}}));
 else if (${JSON.stringify(mode)} === 'invalid') console.log('invalid response');
 else if (${JSON.stringify(mode)} === 'large-frame') console.log('x'.repeat(2 * 1024 * 1024));
 else if (${JSON.stringify(mode)} === 'large-stream') process.stdout.write('x'.repeat(5 * 1024 * 1024));
 else console.log(JSON.stringify({id:2,result:{data:[]}}));
});
`,
        { mode: 0o700 },
      )
      if (mode === 'success') {
        assert.deepEqual(await readCodexHooksSnapshot('/project', executable), {
          data: [],
        })
      } else {
        await assert.rejects(
          readCodexHooksSnapshot('/project', executable),
          (error: unknown) => {
            assert.ok(error instanceof Error)
            assert.match(error.message, /Codex hook inspection/)
            assert.equal(
              error.message.includes('private fixture detail'),
              false,
            )
            return true
          },
        )
      }
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

void test('convergence skips native inspection when Codex is not configured', async () => {
  const home = await mkdtemp(path.join(tmpdir(), 'hooks-no-codex-'))
  try {
    assert.deepEqual(
      await inspectInstalledCodexHooks(home, '/unused', '/project'),
      [],
    )
  } finally {
    await rm(home, { recursive: true, force: true })
  }
})

void test('native Codex hook doctor checks registrations without changing unrelated hooks', () => {
  const snapshot: CodexHooksSnapshot = {
    data: [
      {
        cwd: '/project',
        warnings: [],
        errors: [],
        hooks: [
          ...(
            [
              ['sessionStart', 'session-start-brp-reminder.sh'],
              ['userPromptSubmit', 'user-prompt-skill-router.sh'],
              ['stop', 'stop-verification-gate.sh'],
            ] as const
          ).map(([eventName, filename]) => ({
            eventName,
            handlerType: 'command',
            command: `bash /home/.agents/hooks/${filename}`,
            matcher: null,
            enabled: true,
            trustStatus: 'trusted',
          })),
          {
            eventName: 'stop',
            handlerType: 'command',
            command: 'unrelated',
            enabled: false,
            trustStatus: 'untrusted',
          },
        ],
      },
    ],
  }
  const original = JSON.stringify(snapshot)
  assert.deepEqual(
    findCodexHookRegistrationIssues(
      snapshot,
      '/project',
      '/home/.agents/hooks',
    ),
    [],
  )
  assert.deepEqual(
    findCodexHookRegistrationIssues(
      snapshot,
      '/project',
      '/home/.agents/hooks',
    ),
    [],
  )
  assert.equal(JSON.stringify(snapshot), original)
  for (const trustStatus of ['untrusted', 'modified']) {
    const fixture = structuredClone(snapshot)
    const entry = fixture.data[0]
    assert.ok(entry)
    const hook = entry.hooks[0]
    assert.ok(hook)
    hook.trustStatus = trustStatus
    assert.match(
      findCodexHookRegistrationIssues(
        fixture,
        '/project',
        '/home/.agents/hooks',
      ).join(),
      /trust review/,
    )
  }
  const disabled = structuredClone(snapshot)
  const disabledEntry = disabled.data[0]
  assert.ok(disabledEntry)
  const disabledHook = disabledEntry.hooks[0]
  assert.ok(disabledHook)
  disabledHook.enabled = false
  assert.match(
    findCodexHookRegistrationIssues(
      disabled,
      '/project',
      '/home/.agents/hooks',
    ).join(),
    /disabled/,
  )
  for (const mutation of ['command', 'eventName', 'matcher'] as const) {
    const fixture = structuredClone(snapshot)
    const entry = fixture.data[0]
    assert.ok(entry)
    const hook = entry.hooks[0]
    assert.ok(hook)
    hook[mutation] = 'wrong'
    assert.match(
      findCodexHookRegistrationIssues(
        fixture,
        '/project',
        '/home/.agents/hooks',
      ).join(),
      /missing/,
    )
  }
  const missing = structuredClone(snapshot)
  const missingEntry = missing.data[0]
  assert.ok(missingEntry)
  missingEntry.hooks.shift()
  assert.equal(
    findCodexHookRegistrationIssues(missing, '/project', '/home/.agents/hooks')
      .length,
    1,
  )
  assert.equal(
    findCodexHookRegistrationIssues(snapshot, '/other', '/home/.agents/hooks')
      .length,
    1,
  )
  const error = structuredClone(snapshot)
  const errorEntry = error.data[0]
  assert.ok(errorEntry)
  errorEntry.errors.push({ path: 'private', message: 'sensitive' })
  assert.deepEqual(
    findCodexHookRegistrationIssues(error, '/project', '/home/.agents/hooks'),
    ['Codex reported a hook configuration error.'],
  )
})

/**
 * Guards the failure mode that hid a dead hook in this repo: a hook file that is
 * correct, tested, and wired into hooks.json, but that nothing live ever invokes.
 */

void test('every declared hook is reachable from a live config', () => {
  const unreachable = findUnreachableHooks()
  assert.deepEqual(
    unreachable,
    [],
    `declared in src/hooks/hooks.json but nothing would invoke them: ${unreachable.join(', ')}. ` +
      `Install the plugin, or register them in ~/.claude/settings.json.`,
  )
})

void test('the linked copy matches source', () => {
  const stale = findStaleLinkedHooks()
  assert.deepEqual(
    stale,
    [],
    `~/.agents/hooks has drifted from src/hooks: ${stale.join(', ')}. ` +
      `Run: pnpm run build && pnpm run hooks:link`,
  )
})
