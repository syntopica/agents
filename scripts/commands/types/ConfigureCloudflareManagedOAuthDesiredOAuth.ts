export interface ConfigureCloudflareManagedOAuthDesiredOAuth {
  enabled?: boolean
  dynamic_client_registration?: {
    enabled?: boolean
    allow_any_on_localhost?: boolean
    allow_any_on_loopback?: boolean
  }
}
