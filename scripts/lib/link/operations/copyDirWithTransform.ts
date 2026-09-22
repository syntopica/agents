import { promises as fs } from 'node:fs'

export const copyDirWithTransform = async (
  src: string,
  dest: string,
  source: string,
  transformContent: (content: string, relativePath: string) => string,
): Promise<void> => {
  const entries = await fs.readdir(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = `${src}/${entry.name}`
    const destPath = `${dest}/${entry.name}`
    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true })
      await copyDirWithTransform(srcPath, destPath, source, transformContent)
    } else {
      const rel = srcPath.replace(`${source}/`, '')
      const raw = await fs.readFile(srcPath, 'utf-8')
      const transformed = transformContent(raw, rel)
      await fs.writeFile(destPath, transformed, 'utf-8')
    }
  }
}
