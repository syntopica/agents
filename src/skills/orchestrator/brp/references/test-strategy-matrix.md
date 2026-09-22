# Test Strategy Matrix

Choose the smallest test layer that proves the behavior with confidence.

| Change Type                   | Preferred Test Layer          | When to Go Higher                                         |
| ----------------------------- | ----------------------------- | --------------------------------------------------------- |
| Pure logic / transform        | Unit test                     | When wiring or integration risk dominates                 |
| Service orchestration         | Integration test              | When real I/O or framework behavior matters               |
| UI state / component behavior | Component or integration test | When cross-page flows or routing matter                   |
| User journey / critical path  | End-to-end test               | When lower layers cannot prove the behavior               |
| No stable automation path     | Manual verification           | When setup cost or tooling gaps block reliable automation |

## Selection Rules

- Prefer the lowest layer that covers the risk.
- Add one higher-layer test only when it catches integration failure modes the
  lower layer misses.
- Avoid duplicate assertions across layers unless they guard different risks.
- If only manual verification is possible, make the steps executable and
  precise.
