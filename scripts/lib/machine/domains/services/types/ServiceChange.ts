export interface ServiceChange {
  operation: 'create' | 'update'
  name: string
  file: string
}
