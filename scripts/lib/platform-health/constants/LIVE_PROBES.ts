import type { LiveProbeDefinition } from '../types/LiveProbeDefinition'

export const LIVE_PROBES: LiveProbeDefinition[] = [
  {
    platformId: 'claude',
    capability: 'mcp',
    command: 'claude',
    args: ['mcp', 'list'],
    timeoutMs: 30_000,
  },
  {
    platformId: 'codex',
    capability: 'security',
    command: 'codex',
    args: ['login', 'status'],
    timeoutMs: 10_000,
  },
  {
    platformId: 'codex',
    capability: 'mcp',
    command: 'codex',
    args: ['mcp', 'list'],
    timeoutMs: 30_000,
  },
  {
    platformId: 'gemini-cli',
    capability: 'mcp',
    command: 'gemini',
    args: ['mcp', 'list'],
    timeoutMs: 30_000,
  },
  {
    platformId: 'gemini-cli',
    capability: 'skills',
    command: 'gemini',
    args: ['skills', 'list'],
    timeoutMs: 30_000,
  },
  {
    platformId: 'cursor',
    capability: 'security',
    command: 'cursor-agent',
    args: ['status'],
    timeoutMs: 10_000,
  },
  {
    platformId: 'cursor',
    capability: 'mcp',
    command: 'cursor-agent',
    args: ['mcp', 'list'],
    timeoutMs: 30_000,
  },
]
