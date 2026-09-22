import { homedir } from 'node:os'

/**
 * Expand `$HOME`, `${HOME}` and a leading `~/` in a manifest string.
 *
 * A manifest is written once and read on every machine, so it spells paths
 * relative to the home directory. Nothing between the manifest and the client
 * runs a shell: the rendered stdio server is spawned with these arguments
 * verbatim, so an unexpanded `$HOME/p/atrium` reaches the server as a literal
 * directory that does not exist.
 */
export const expandHomePlaceholder = (value: string, home = homedir()) =>
  value
    .replace(/^~(?=\/|$)/, home)
    .replaceAll('${HOME}', home)
    .replaceAll('$HOME', home)
