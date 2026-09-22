/**
 * Removes npm's own notice and warning lines from stage output. Every loop
 * stage shells out through npx, so without this each report section opens with
 * npm's env-config warning rather than the stage's first real line.
 */
export const stripNpmChatter = (output: string) =>
  output.replaceAll(/^npm (?:notice|warn|WARN).*$\n?/gm, '')
