export const collectStartupTimeoutErrors = (
  name: string,
  startupTimeout: unknown,
  errors: string[],
) => {
  if (
    startupTimeout !== undefined &&
    (typeof startupTimeout !== 'number' ||
      !Number.isFinite(startupTimeout) ||
      startupTimeout <= 0)
  ) {
    errors.push(`${name}: startup_timeout_sec must be a positive finite number`)
  }
}
