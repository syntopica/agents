export const escapeTomlString = (value: string) =>
  `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
