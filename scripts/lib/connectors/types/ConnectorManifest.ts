import type { ConnectorDefinition } from './ConnectorDefinition'

export interface ConnectorManifest {
  version: 1
  connectors: ConnectorDefinition[]
}
