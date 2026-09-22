import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { buildManagedOAuthApplicationUpdate } from '../lib/connectors/buildManagedOAuthApplicationUpdate'

export const main = async () => {
  const cliArguments = process.argv.slice(2)
  if (cliArguments[0] === '--') cliArguments.shift()
  const { values } = parseArgs({
    args: cliArguments,
    options: {
      'account-id': { type: 'string' },
      'application-id': { type: 'string' },
      profile: { type: 'string', default: 'default' },
      apply: { type: 'boolean', default: false },
    },
  })
  const accountId = values['account-id']
  const applicationId = values['application-id']
  const profile = values.profile
  if (accountId === undefined || applicationId === undefined) {
    throw new Error('--account-id and --application-id are required')
  }
  if (
    !/^[a-f0-9]{32}$/u.test(accountId) ||
    !/^[a-f0-9-]{36}$/u.test(applicationId)
  ) {
    throw new Error('Cloudflare account or application identifier is invalid')
  }
  if (!/^[a-zA-Z0-9._-]+$/u.test(profile))
    throw new Error('Alchemy profile name is invalid')

  const credentialPath = join(
    homedir(),
    '.alchemy',
    'credentials',
    profile,
    'cf-oauth.json',
  )
  const credentials = JSON.parse(await readFile(credentialPath, 'utf8')) as {
    access?: unknown
  }
  if (
    typeof credentials.access !== 'string' ||
    credentials.access.length === 0
  ) {
    throw new Error(
      `Alchemy profile '${profile}' has no Cloudflare OAuth access token`,
    )
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/access/apps/${applicationId}`
  const headers = {
    Authorization: `Bearer ${credentials.access}`,
    'Content-Type': 'application/json',
  }
  const currentResponse = await fetch(endpoint, { headers })
  const currentBody = (await currentResponse.json()) as {
    success?: boolean
    result?: Record<string, unknown>
    errors?: unknown[]
  }
  if (
    !currentResponse.ok ||
    currentBody.success !== true ||
    currentBody.result === undefined
  ) {
    throw new Error(
      `Cloudflare application read failed (${String(currentResponse.status)}): ${JSON.stringify(currentBody.errors ?? [])}`,
    )
  }

  const update = buildManagedOAuthApplicationUpdate(currentBody.result)
  const desiredOAuth = update['oauth_configuration'] as {
    enabled?: boolean
    dynamic_client_registration?: {
      enabled?: boolean
      allow_any_on_localhost?: boolean
      allow_any_on_loopback?: boolean
    }
  }
  if (!values.apply) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: 'dry-run',
          name: currentBody.result['name'],
          domain: currentBody.result['domain'],
          endpoint,
          desired: {
            enabled: desiredOAuth.enabled === true,
            dynamicClientRegistration:
              desiredOAuth.dynamic_client_registration?.enabled === true,
            allowAnyOnLocalhost:
              desiredOAuth.dynamic_client_registration
                ?.allow_any_on_localhost === true,
            allowAnyOnLoopback:
              desiredOAuth.dynamic_client_registration
                ?.allow_any_on_loopback === true,
          },
        },
        null,
        2,
      ),
    )
    return
  }

  const updateResponse = await fetch(endpoint, {
    method: 'PUT',
    headers,
    body: JSON.stringify(update),
  })
  const updateBody = (await updateResponse.json()) as {
    success?: boolean
    errors?: unknown[]
  }
  if (!updateResponse.ok || updateBody.success !== true) {
    throw new Error(
      `Cloudflare application update failed (${String(updateResponse.status)}): ${JSON.stringify(updateBody.errors ?? [])}`,
    )
  }

  const verifyResponse = await fetch(endpoint, { headers })
  const verifyBody = (await verifyResponse.json()) as {
    success?: boolean
    result?: Record<string, unknown>
    errors?: unknown[]
  }
  if (
    !verifyResponse.ok ||
    verifyBody.success !== true ||
    verifyBody.result === undefined
  ) {
    throw new Error(
      `Cloudflare application verification failed (${String(verifyResponse.status)}): ${JSON.stringify(verifyBody.errors ?? [])}`,
    )
  }
  const verifiedOAuth = verifyBody.result['oauth_configuration'] as
    | {
        enabled?: boolean
        dynamic_client_registration?: {
          enabled?: boolean
          allow_any_on_localhost?: boolean
          allow_any_on_loopback?: boolean
        }
      }
    | undefined
  const verification = {
    enabled: verifiedOAuth?.enabled === true,
    dynamicClientRegistration:
      verifiedOAuth?.dynamic_client_registration?.enabled === true,
    allowAnyOnLocalhost:
      verifiedOAuth?.dynamic_client_registration?.allow_any_on_localhost ===
      true,
    allowAnyOnLoopback:
      verifiedOAuth?.dynamic_client_registration?.allow_any_on_loopback ===
      true,
  }
  const ok = Object.values(verification).every(Boolean)
  console.log(
    JSON.stringify(
      {
        ok,
        mode: 'apply',
        name: verifyBody.result['name'],
        domain: verifyBody.result['domain'],
        verification,
      },
      null,
      2,
    ),
  )
  if (!ok) process.exitCode = 1
}
