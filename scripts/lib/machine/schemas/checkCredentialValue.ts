import { isSecretReference } from '../secrets/isSecretReference'
import { isAllowedLiteral } from './isAllowedLiteral'

export const checkCredentialValue = (
  location: string,
  value: unknown,
  findings: string[],
) => {
  if (isSecretReference(value)) {
    return
  }

  if (typeof value !== 'string') {
    findings.push(`${location} must be a string or a { from_env } reference`)
    return
  }

  if (!isAllowedLiteral(value)) {
    findings.push(
      `${location} looks like a credential literal; use { from_env: NAME } instead`,
    )
  }
}
