export interface ServerShape {
  args?: unknown[]
  env?: Record<string, unknown>
  headers?: Record<string, unknown>
  target_overrides?: Record<
    string,
    { env?: Record<string, unknown> } | undefined
  >
}
