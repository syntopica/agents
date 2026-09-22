import type { CapabilityStatus } from '../platform-health/types/CapabilityStatus'
import type { ProfileConnectorResult } from './types/ProfileConnectorResult'

export const connectorResultsStatus = (
  results: ProfileConnectorResult[],
): CapabilityStatus => {
  if (
    results.some(
      ({ criticality, status }) =>
        criticality === 'required' && status === 'failed',
    )
  )
    return 'failed'
  if (
    results.some(
      ({ criticality, status }) =>
        criticality === 'required' && status === 'auth-required',
    )
  )
    return 'auth-required'
  if (
    results.some(
      ({ status }) =>
        status === 'failed' || status === 'degraded' || status === 'disabled',
    )
  )
    return 'degraded'
  return 'healthy'
}
