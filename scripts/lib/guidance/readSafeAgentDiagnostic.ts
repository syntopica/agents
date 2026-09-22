export const readSafeAgentDiagnostic = (stderr: Buffer): string | undefined => {
  const pattern = /(Agent guidance reconciler: [A-Za-z0-9 .,:()-]+)/u
  const match = pattern.exec(stderr.toString('utf8'))
  return match?.[1]
}
