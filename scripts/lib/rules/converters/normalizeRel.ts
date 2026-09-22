export function normalizeRel(rel: string) {
  const s = rel.replace(/\\/g, '/').replace(/^\/+/, '')
  return s.replace(/(^|\/)\.\.(?=\/|$)/g, '')
}
