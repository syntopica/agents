import type { ServiceDefinition } from '../types/ServiceDefinition'

export const createServiceDefinition = (
  overrides: Partial<ServiceDefinition> = {},
): ServiceDefinition => ({
  name: 'com.cristian.library-loop',
  workingDirectory: 'p/agents',
  command: 'npx tsx scripts/bin/run-library-loop.ts',
  logPath: '.agents-learning/loop.log',
  schedule: { weekday: 0, hour: 6, minute: 30 },
  ...overrides,
})
