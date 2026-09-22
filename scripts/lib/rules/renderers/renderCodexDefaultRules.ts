export const renderCodexDefaultRules = () =>
  [
    '# Managed by Rocket Agents.',
    '#',
    '# Codex parses this file as Starlark exec-policy, not Markdown.',
    '# Keep human-readable agent guidance in AGENTS.md.',
    '#',
    '# This file intentionally starts with no prefix_rule() entries.',
    '# Add or accept Codex exec-policy rules here when you want to allow, prompt,',
    '# or forbid specific command prefixes outside the sandbox.',
    '#',
    '# Primary reusable guidance for this project lives in AGENTS.md and skills.',
    '',
  ].join('\n')
