export const CODEX_SKILL_READ_PATTERNS = [
  /skillkit read ([a-z0-9:-]{2,60})/g,
  /(?:cat|head|sed -n|less|Read|read_file)[^\n"]{0,60}?skills\/(?:[a-z0-9-]{2,40}\/)?([a-z0-9-]{2,40})\/SKILL\.md/g,
] as const
