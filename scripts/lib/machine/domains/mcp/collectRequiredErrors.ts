export const collectRequiredErrors = (
  name: string,
  required: unknown,
  errors: string[],
) => {
  if (required !== undefined && typeof required !== 'boolean') {
    errors.push(`${name}: required must be a boolean`)
  }
}
