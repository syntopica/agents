/**
 * Skill listings truncate long descriptions, so an activation boundary that
 * starts late can be cut off entirely. Keep the "Trigger when" clause inside
 * the first 150 characters (decision recorded 2026-08-13).
 */
export const descriptionTriggerPositionError = (description: string) => {
  const index = description.search(/trigger when/i)
  if (index === -1) return null // descriptionBoundaryErrors already reports absence
  if (index < 150) return null
  return `'Trigger when' starts at character ${String(index)}; it must start before 150 to survive listing truncation`
}
