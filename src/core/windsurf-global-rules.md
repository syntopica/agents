# Global Engineering Rules

- Write code, comments, identifiers, documentation, and Git metadata in English.
- Keep one exported unit and one responsibility per file. Split helpers into
  named modules and use explicit imports.
- Prefer small, reversible changes. Preserve unrelated files and foreign
  configuration.
- Follow the repository's existing architecture, naming, package manager, and
  verification commands.
- Use current official documentation before changing library, framework, SDK,
  CLI, or service integration behavior.
- Keep route and command handlers thin: validate input, call a focused service,
  and return the result.
- Never commit secrets, credentials, tokens, cookies, generated captures, or
  environment files.
- Validate external input at trust boundaries and use least-privilege access.
- Run the repository's complete check after meaningful changes and report any
  verification that could not run.
- Write conventional, imperative Git commit subjects. Do not add tool
  attribution or assistant co-author trailers.
- Do not edit an existing migration without explicit confirmation.
- Treat `AGENTS.md` as the repository instruction source and apply nested
  instructions to files in their scope.
