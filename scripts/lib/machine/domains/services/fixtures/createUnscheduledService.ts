import type { ServiceDefinition } from '../types/ServiceDefinition'

export const createUnscheduledService = (
  overrides: Partial<ServiceDefinition> = {},
): ServiceDefinition => ({
  name: 'com.cristian.stayawake',
  workingDirectory: 'p/agents',
  command: 'caffeinate -dimsu',
  ...overrides,
})
