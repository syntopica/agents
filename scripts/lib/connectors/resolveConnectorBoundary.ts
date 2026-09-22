import type { ConnectorDefinition } from './types/ConnectorDefinition'
import type { ProfileConnectorResult } from './types/ProfileConnectorResult'

export const resolveConnectorBoundary = (
  definition: ConnectorDefinition,
): ProfileConnectorResult['boundary'] => definition.boundary ?? 'client'
