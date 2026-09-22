import { promises as fs } from 'node:fs'

export const readPackageJson = async (
  packageJsonPath: string,
): Promise<Record<string, unknown>> => {
  const raw = await fs.readFile(packageJsonPath, 'utf8')
  return JSON.parse(raw) as Record<string, unknown>
}
