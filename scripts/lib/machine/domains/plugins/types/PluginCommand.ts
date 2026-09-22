export interface PluginCommand {
  argv: string[]
  env?: Record<string, string>
}
