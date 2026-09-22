import type { CONNECTOR_STATUSES } from '../constants/CONNECTOR_STATUSES'

export type ConnectorStatus = (typeof CONNECTOR_STATUSES)[number]
