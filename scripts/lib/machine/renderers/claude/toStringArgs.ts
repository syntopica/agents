import type { McpValue } from '../../domains/mcp/types/McpValue'
import { expandHomePlaceholder } from './expandHomePlaceholder'

export const toStringArgs = (
  args: McpValue[] | undefined,
  appended: string[],
) =>
  [
    ...(args ?? []).filter(
      (value): value is string => typeof value === 'string',
    ),
    ...appended,
  ].map((value) => expandHomePlaceholder(value))
