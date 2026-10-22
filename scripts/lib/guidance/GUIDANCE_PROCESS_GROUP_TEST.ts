import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { setTimeout } from 'node:timers/promises'
import { killReconciliationFixtureProcess } from './fixtures/killReconciliationFixtureProcess'
import { runReconciliationAgent } from './runReconciliationAgent'
import type { GuidancePolicy } from './types/GuidancePolicy'

void test('reconciliation cleans its owned descendants on success, timeout, overflow and failure', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'guidance-group-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  for (const mode of ['success', 'timeout', 'stdout', 'stderr', 'failure']) {
    const script = join(root, `${mode}.mjs`)
    const marker = `${root}/${mode}-descendant`
    await writeFile(
      script,
      `import {spawn} from 'node:child_process';
const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});setInterval(()=>{},1000)",${JSON.stringify(marker)}],{stdio:'inherit'});
process.stdin.resume();
setTimeout(()=>{
 if (${JSON.stringify(mode)}==='success') { console.log(JSON.stringify({pid:child.pid,scratch:process.env.TMPDIR}));process.exit(0); }
 if (${JSON.stringify(mode)}==='failure') process.exit(7);
 if (${JSON.stringify(mode)}==='stdout') process.stdout.write('x'.repeat(20000));
 if (${JSON.stringify(mode)}==='stderr') process.stderr.write('x'.repeat(20000));
},300);
setInterval(()=>{},1000);
`,
    )
    const policy: GuidancePolicy = {
      version: 1,
      requiredInvariants: [],
      officialDocumentationOrigins: { claude: [], codex: [] },
      maxOutputBytes: 10_000,
      agentCommand: [process.execPath, script],
      timeoutMs: 1_000,
    }
    const operation = runReconciliationAgent(policy, '{}')
    const observed = operation.then(
      (result: unknown) => ({ ok: true, result }),
      (error: unknown) => ({ ok: false, error }),
    )
    let pid: number | undefined
    for (let attempt = 0; attempt < 20 && pid === undefined; attempt += 1) {
      const row = execFileSync('/bin/ps', ['-axo', 'pid=,command='], {
        encoding: 'utf8',
      })
        .split('\n')
        .find((line) => line.trimEnd().endsWith(marker))
      if (row !== undefined) pid = Number(row.trim().split(/\s/u)[0])
      else await setTimeout(25)
    }
    assert.ok(
      pid,
      `fixture descendant observed for ${mode}: ${JSON.stringify(await (pid === undefined ? observed : undefined))}`,
    )
    try {
      const outcome = await observed
      assert.equal(outcome.ok, mode === 'success', mode)
      if ('error' in outcome) {
        assert.ok(outcome.error instanceof Error)
        assert.match(
          outcome.error.message,
          /timeout|byte limit|exited with code 7/u,
        )
      }
      assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' }, mode)
    } finally {
      killReconciliationFixtureProcess(pid)
    }
  }
})
