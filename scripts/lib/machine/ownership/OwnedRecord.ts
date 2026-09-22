export type OwnedRecord = Partial<
  Record<'mcp' | 'security' | 'capabilities', Record<string, string[]>>
>
