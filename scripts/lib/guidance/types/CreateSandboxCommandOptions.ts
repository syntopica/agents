export interface CreateSandboxCommandOptions {
  platform: NodeJS.Platform
  scratchDir: string
  readDenyRoot?: string
  readAllowPaths?: string[]
  command: string
  args: string[]
  pathExists?: (path: string) => boolean
}
