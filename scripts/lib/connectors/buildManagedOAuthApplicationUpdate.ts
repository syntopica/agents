export const buildManagedOAuthApplicationUpdate = (
  application: Record<string, unknown>,
): Record<string, unknown> => {
  const readOnlyFields = new Set([
    'id',
    'uid',
    'aud',
    'created_at',
    'updated_at',
  ])
  const update = Object.fromEntries(
    Object.entries(structuredClone(application)).filter(
      ([field]) => !readOnlyFields.has(field),
    ),
  )

  const currentOAuth =
    typeof update['oauth_configuration'] === 'object' &&
    update['oauth_configuration'] !== null &&
    !Array.isArray(update['oauth_configuration'])
      ? (update['oauth_configuration'] as Record<string, unknown>)
      : {}
  const currentRegistration =
    typeof currentOAuth['dynamic_client_registration'] === 'object' &&
    currentOAuth['dynamic_client_registration'] !== null &&
    !Array.isArray(currentOAuth['dynamic_client_registration'])
      ? (currentOAuth['dynamic_client_registration'] as Record<string, unknown>)
      : {}

  update['oauth_configuration'] = {
    ...currentOAuth,
    enabled: true,
    dynamic_client_registration: {
      ...currentRegistration,
      enabled: true,
      allow_any_on_localhost: true,
      allow_any_on_loopback: true,
    },
  }

  return update
}
