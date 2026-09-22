export const renderStartInterval = (intervalSeconds: number): string[] => [
  '  <key>StartInterval</key>',
  `  <integer>${String(intervalSeconds)}</integer>`,
]
