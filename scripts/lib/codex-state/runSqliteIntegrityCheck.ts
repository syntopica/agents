import { spawn } from 'node:child_process'
import { constants } from 'node:fs'
import { access } from 'node:fs/promises'
import type { DatabaseIntegrity } from './types/DatabaseIntegrity'

export const runSqliteIntegrityCheck = async (
  path: string,
): Promise<DatabaseIntegrity> => {
  try {
    await access(path, constants.R_OK)
  } catch (error: unknown) {
    const code =
      error instanceof Error && 'code' in error ? error.code : undefined
    return code === 'ENOENT'
      ? { path, status: 'missing', summary: 'optional database is absent' }
      : { path, status: 'unreadable', summary: 'database is not readable' }
  }

  return new Promise((resolve) => {
    // -readonly: without it a current sqlite3 (Homebrew 3.53) deletes the stale
    // -wal and -shm sidecars of a file that is not a database, and the family
    // that quarantine must move is gone before it is listed.
    const child = spawn(
      'sqlite3',
      ['-readonly', path, 'PRAGMA integrity_check;'],
      {
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )
    let output = ''

    const append = (chunk: Buffer) => {
      output = `${output}${chunk.toString()}`.slice(-8192)
    }
    child.stdout.on('data', append)
    child.stderr.on('data', append)
    child.on('error', () => {
      resolve({
        path,
        status: 'unreadable',
        summary: 'sqlite3 could not inspect database',
      })
    })
    child.on('close', (exitCode) => {
      const passed = exitCode === 0 && output.trim() === 'ok'
      resolve(
        passed
          ? { path, status: 'ok', summary: 'integrity check passed' }
          : { path, status: 'corrupt', summary: 'integrity check failed' },
      )
    })
  })
}
