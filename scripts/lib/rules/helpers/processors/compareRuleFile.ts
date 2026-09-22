import { promises as fs } from 'node:fs'

/**
 * Compare expected content with current file content
 * @param {string} targetPath - Target file path
 * @param {string} expected - Expected content
 * @returns {Promise<{missing: boolean, outdated: boolean}>}
 */
export async function compareRuleFile(targetPath: string, expected: string) {
  try {
    const current = await fs.readFile(targetPath, 'utf8')
    return {
      missing: false,
      outdated: current !== expected,
    }
  } catch {
    return {
      missing: true,
      outdated: false,
    }
  }
}
