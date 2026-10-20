import type { ConnectorDefinition } from './ConnectorDefinition'

export interface ParseConnectorManifestManifest {
  version: 1
  connectors: ConnectorDefinition[]
}
