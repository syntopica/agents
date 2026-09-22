import { checkCredentialValue } from './checkCredentialValue'
import type { ServerShape } from './types/ServerShape'

export const findCredentialLiterals = (server: ServerShape) => {
  const findings: string[] = []

  server.args?.forEach((value, index) => {
    checkCredentialValue(`args[${String(index)}]`, value, findings)
  })

  for (const [key, value] of Object.entries(server.env ?? {})) {
    checkCredentialValue(`env.${key}`, value, findings)
  }

  for (const [key, value] of Object.entries(server.headers ?? {})) {
    checkCredentialValue(`headers.${key}`, value, findings)
  }

  return findings
}
