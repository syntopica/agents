# CONTEXT.md glossary format (brp-docs reference)

`CONTEXT.md` is a glossary and nothing else: totally devoid of implementation
details.

## Entry format

- The term, named once.
- A 1-2 sentence definition of what the term IS, not what it does.
- An `Avoid:` list of banned synonyms.

## Rules

- Be opinionated: pick one word per concept and ban the rest.
- Only project-specific terms; never general programming concepts.
- Write entries inline the moment a term resolves, never in a batch at the end.
  Create the file lazily, on the first term.

## During a session

- Challenge usage that conflicts with the glossary ("the glossary defines
  cancellation as X, you seem to mean Y").
- Sharpen overloaded terms ("'account' - Customer or User?").
- Cross-reference claims against the code and surface contradictions.
