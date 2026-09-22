export const collectToolApprovalModeErrors = (
  name: string,
  value: unknown,
  errors: string[],
) => {
  if (
    value !== undefined &&
    (typeof value !== 'string' ||
      !['auto', 'prompt', 'writes', 'approve'].includes(value))
  ) {
    errors.push(
      `${name}: default_tools_approval_mode must be auto, prompt, writes, or approve`,
    )
  }
}
