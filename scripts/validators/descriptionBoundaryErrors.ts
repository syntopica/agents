export const descriptionBoundaryErrors = (description: string) => {
  const errors = []
  if (!/trigger when/i.test(description)) {
    errors.push(
      "description must include an explicit 'Trigger when ...' activation boundary",
    )
  }
  if (!/do not use/i.test(description)) {
    errors.push(
      "description must include an explicit 'Do not use ...' exclusion boundary",
    )
  }
  return errors
}
