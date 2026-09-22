# BRP skill invoked token cost

Measured 2026-08-22 over `src/skills/*/*/SKILL.md` with the `gpt-tokenizer` BPE
(cl100k). This approximates but does not equal Anthropic's tokenizer; treat
figures as +/-10%. Invoked cost is the SKILL.md body, which is what loads when
the skill fires. References load on demand and are listed separately; they only
cost tokens when the workflow explicitly loads them.

Reference bar: Pocock's `/grilling`, a gate-shaped skill, measures 345 tokens
invoked. Anything an order of magnitude above that (> ~3,500) needs a reason. No
BRP skill crosses it today.

| Skill                      | Invoked | Refs | Ref tokens |
| -------------------------- | ------- | ---- | ---------- |
| core/brp-todo-work         | 1,980   | 1    | 534        |
| core/brp-todo-create       | 1,474   | 4    | 1,939      |
| core/brain                 | 1,300   | 0    | -          |
| core/brp-traffic-client    | 773     | 3    | 3,198      |
| core/invoice-quarter-close | 723     | 0    | -          |
| core/brp-code-quality      | 576     | 2    | 1,457      |
| core/lovable-sync          | 569     | 0    | -          |
| core/stakeholder-recap     | 533     | 0    | -          |
| orchestrator/brp           | 508     | 14   | 5,023      |
| core/brp-release           | 492     | 0    | -          |
| core/handoff               | 480     | 0    | -          |
| core/project-continuation  | 470     | 0    | -          |
| core/brp-docs              | 393     | 2    | 435        |
| core/brp-rust-quality      | 336     | 0    | -          |

Notes:

- `brp-todo-work` and `brp-todo-create` are the heaviest by design: they were
  deliberately refilled (2026-08-22) from the prompt files they had been lossily
  compressed from, after measurement showed the full prompts outperformed the
  compressed skills 70:7 and 318-line:78 in 30-day invocations.
- `orchestrator/brp` keeps its invoked cost at 508 by routing everything through
  on-demand references; that is the pattern to copy when a skill grows.

Re-measure after any skill edit that adds more than a paragraph. Method: in a
temp directory, `npm install gpt-tokenizer`, then per skill directory count
`countTokens(SKILL.md)` and the sum of `countTokens(references/*.md)`:

```js
import { countTokens } from 'gpt-tokenizer'
import { readFileSync } from 'node:fs'
console.log(countTokens(readFileSync(process.argv[2], 'utf8')))
```
