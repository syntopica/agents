import type { McpCapture } from '../../domains/mcp/types/McpCapture'

export const formatMcpCapture = (capture: McpCapture, asJson: boolean) => {
  if (asJson) {
    return JSON.stringify(capture, null, 2)
  }

  const names = Object.keys(capture.manifest.servers)
  const lines = [
    `captured ${String(names.length)} refused ${String(capture.refused.length)}`,
  ]

  for (const name of names) {
    const server = capture.manifest.servers[name]
    lines.push(
      `  ${name.padEnd(24)} ${server?.transport ?? ''} ${server?.targets.join(',') ?? ''}`,
    )
  }

  for (const refusal of capture.refused) {
    lines.push(
      `  refused ${refusal.server} ${refusal.field}: ${refusal.reason}`,
    )
  }

  return lines.join('\n')
}
