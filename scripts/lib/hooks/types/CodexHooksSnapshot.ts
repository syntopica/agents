export interface CodexHooksSnapshot {
  data: {
    cwd: string
    hooks: {
      eventName: string
      handlerType: string
      command?: string
      matcher?: string | null
      enabled: boolean
      trustStatus: string
    }[]
    warnings: string[]
    errors: { message: string; path: string }[]
  }[]
}
