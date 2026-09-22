import { join } from 'node:path'

export const resolveRunsDir = (home: string) =>
  join(home, '.agents-machine', 'runs')
