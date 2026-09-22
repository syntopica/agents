import { expandHomePlaceholder } from './expandHomePlaceholder'

/** A manifest command with its home placeholder expanded, or nothing. */
export const expandedCommand = (command: string | undefined) =>
  command === undefined ? command : expandHomePlaceholder(command)
