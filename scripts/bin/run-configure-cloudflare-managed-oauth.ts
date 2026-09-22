import { main } from '../commands/configureCloudflareManagedOAuth'

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : 'Cloudflare Managed OAuth update failed',
  )
  process.exitCode = 1
})
