import { join } from 'node:path'

export const resolveOwnedPath = (home: string) =>
  join(home, '.agents-machine', 'owned.json')
