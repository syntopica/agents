import { execFile } from 'node:child_process'

export const createSqliteDatabase = async (path: string): Promise<void> =>
  new Promise((resolve, reject) => {
    execFile(
      'sqlite3',
      [path, 'CREATE TABLE example (id INTEGER);'],
      (error) => {
        if (error === null) resolve()
        else reject(new Error(error.message, { cause: error }))
      },
    )
  })
