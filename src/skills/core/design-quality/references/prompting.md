# Prompting models for good UI: what the official guides say

Condensed from the Anthropic and OpenAI guides (fetched 2026-10-01). Each
technique carries the source that recommends it. Where both vendors say the same
thing, it is listed once with both sources. Raw copies and summaries are listed
in `sources.md`.

Sources:

- [A-BP] Anthropic, Prompting best practices, Frontend design:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- [A-48] Anthropic, Prompting Claude Opus 4.8, Design and frontend defaults:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-4-8
- [A-S5] Anthropic, Prompting Claude Sonnet 5, same section:
  https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5
- [A-CB] Anthropic cookbook, Prompting for frontend aesthetics (MIT):
  https://github.com/anthropics/claude-cookbooks/blob/main/coding/prompting_for_frontend_aesthetics.ipynb
- [A-BL] Claude blog, Improving frontend design through Skills:
  https://claude.com/blog/improving-frontend-design-through-skills
- [A-SK] Anthropic `frontend-design` skill:
  https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md
- [O-FP] OpenAI, Frontend prompt instructions (GPT-5.5):
  https://developers.openai.com/api/docs/guides/frontend-prompt
- [O-54] OpenAI, Designing delightful frontends with GPT-5.4:
  https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4
- [O-FS] OpenAI `frontend-skill` (removed 2026-04-23, kept locally):
  https://github.com/openai/skills/tree/82d2c5b/skills/.curated/frontend-skill
- [O-G5] OpenAI cookbook GPT-5, 5.1 and 5.2 prompting guides, and the Codex
  prompting guide:
  https://github.com/openai/openai-cookbook/tree/main/examples/gpt-5

## 1. Why output looks generic, and the general fix

- Without direction, models sample the high-probability centre of their training
  data, which produces "safe", interchangeable UI. [A-BL] [O-54]
- Each model also has its own house style. Opus 4.8's is a cream (about #F4F1EA)
  background, serif display type, italic accents and a terracotta accent. The
  docs say it "will feel off for dashboards, dev tools, fintech, healthcare, or
  enterprise apps". [A-48] [A-S5]
- **Negative instructions only move the default.** "Don't use cream" or "make it
  clean and minimal" lands on a different fixed palette. Even after a font ban,
  the model converges on a new favourite (Space Grotesk). [A-48] [A-BL] [A-CB]
- **Fix: give a concrete specification.** Models follow explicit specs
  precisely: hex palette, radius ("4px everywhere"), type character, section
  structure, hover behaviour and its duration. [A-48] [O-54]
- Write at the right altitude: name design dimensions that map to code
  (typography, colour and theme, motion, backgrounds, spacing). Neither vague
  taste words nor hard-coded logic. [A-BL]

## 2. Set the design system before any code

- Name tokens by role (`background`, `surface`, `primary text`, `muted text`,
  `accent`, `border`, `ring`) and type by role (display, headline, body,
  caption). [O-54] [O-G5 5.1]
- **Tokens only**: no literal hex, hsl or oklch in JSX or CSS. A new brand
  colour is added to the tokens under `:root` and `.dark` before it is used.
  [O-G5 5.1 `<design_system_enforcement>`]
- Hard numeric constraints work: one H1, at most six sections, at most two
  typefaces, one accent colour, one primary call to action. [O-54] [O-FS]
- Use 4-5 font sizes and weights, one neutral base plus at most two accents, and
  spacing in multiples of 4. [O-G5 `<ui_ux_best_practices>`]
- Card radius at most 8px unless the design system says otherwise; no negative
  letter-spacing; no font size that scales with viewport width. [O-FP]

## 3. In an existing product: constrain scope

- Explore the existing design system first and match its conventions; this
  overrides every "be distinctive" instruction. [O-FP] [O-54] [O-G5 Codex]
  [A-SK]
- GPT-5.2 tends to add features and styling, so say: implement exactly and only
  what is asked; no extra components or UX embellishments; never invent colours,
  shadows, tokens or animations; pick the simplest valid reading of an ambiguous
  instruction. [O-G5 5.2 `<design_and_scope_constraints>`]

## 4. Fit the register to the domain (the admin and CRM case)

- SaaS, CRM and operational tools should be "quiet, utilitarian and
  work-focused": dense but organised information, restrained styling,
  predictable navigation, built for scanning, comparison and repeated action. No
  hero sections, decorative card layouts or marketing composition. [O-FP]
- App default is "Linear-style restraint": a calm surface hierarchy, few
  colours, minimal chrome, and cards only when the card is the interaction.
  Organise the screen as workspace, navigation, inspector and one accent. Avoid
  card mosaics, thick borders on every region, and decorative gradients behind
  product UI. [O-FS]
- Utility copy: headings say what the area is or what the user can do there
  ("Plan status", "Last sync"). Supporting text states scope, freshness or the
  decision it helps with. Litmus test: an operator who scans only headings,
  labels and numbers understands the page. [O-FS] [O-54]
- No in-app text that explains the app's own features; build the working screen,
  not a landing page. [O-FP]
- Choose the right control for each job (segmented control for modes, toggle for
  binary settings, stepper for numbers, tabs for views); icons from one library,
  with a tooltip on unfamiliar ones. [O-FP]
- Build the full set of controls, states and views a target user would expect
  (empty, loading, error, disabled). [O-FP] [O-G5]

## 5. Get variety on purpose

- Ask for **4 distinct directions** before building (background hex, accent hex,
  typeface, one-line rationale), let the user pick, and build only that one.
  Sonnet 5 does not accept `temperature`, so this is the documented replacement
  for sampling variety. [A-48] [A-S5]
- Ask the model to generate a mood board, or attach screenshots, to set visual
  guardrails. [O-54]
- Reference named aesthetics (IDE themes, cultural styles) instead of
  adjectives. [A-BP] [A-CB]

## 6. Short, isolated prompts for one dimension

- The full aesthetics prompt is about 400 tokens. Ship it as an on-demand skill
  rather than a permanent system prompt, so other tasks do not pay for it.
  [A-BL]
- Isolate one dimension (typography only, or a locked theme) when only that axis
  should change; generations are faster and more predictable. [A-CB]
- Newer Claude models need a shorter anti-slop snippet than older ones. [A-48]

## 7. Reasoning level and stack

- For frontend work, start at **low or medium reasoning**: more reasoning
  overthinks simple UIs. Raise it only for ambitious builds. [O-54] (Anthropic's
  coding guidance instead suggests `high` or `xhigh` effort for agentic coding
  products [A-S5]; the two advise differently, so test per model.)
- Both vendors name React plus Tailwind as the stack the models know best;
  OpenAI adds shadcn/ui or Radix, Lucide and Motion. [O-54] [O-G5]

## 8. Self-check and verification loop

- Ask the model to build its own rubric of 5-7 categories for a world-class
  result, keep it private, and iterate until every category scores top marks.
  [O-G5 `<self_reflection>`]
- Give the model **Playwright** (or browser) tools: render, test desktop and
  mobile viewports, walk the flows, and compare against the reference
  screenshot. "Providing a Playwright tool or skill significantly improves" the
  result. [O-54] [O-FP]
- Explicit final checks to write into the prompt [O-FP]:
  - Text fits its container at every viewport; nothing overlaps.
  - Fixed and floating elements stay off text and buttons.
  - Scan the CSS colours for a one-hue-family palette and revise if found.
- Ground the work in real copy and product context; placeholder content produces
  placeholder structure. [O-54]
- When done, start the dev server and hand over the URL. [O-FP]

## 9. Defaults both vendors tell the model to avoid

- Overused fonts: Inter, Roboto, Arial, Open Sans, Lato, system stacks; also
  Space Grotesk as the new default. [A-BP] [A-CB] [O-G5 Codex] [O-54]
- Purple gradients on white or dark, purple or dark-mode bias, one-hue palettes
  (beige or cream, slate, espresso). [A-BP] [O-FP] [O-54]
- Nested cards, pages built from floating cards, hero cards, pill clusters, stat
  strips, icon rows, decorative orbs and bokeh blobs. [O-FP] [O-FS]
- Scattered micro-motion. Use one orchestrated entrance or 2-3 intentional
  motions on visually led pages; on product UI, motion only where it sharpens an
  affordance. [A-BP] [O-FS]

Note for admin UI: several anti-slop items above (atmospheric backgrounds,
distinctive display fonts, "use gradients") target landing pages. For an admin
or CRM screen, [O-FP] §4 takes precedence: a quiet, dense, neutral surface with
one accent.

## Ready-to-use block for our admin apps

Composed from the sources above (not a vendor quote):

```
<admin_ui>
This is an operational CRM/admin tool. Match the existing design system and tokens exactly; do not invent colours, shadows, radii, fonts or animations. Keep it quiet and dense: tables for records (numbers right-aligned, tabular-nums), one accent colour used only for the primary action and selection, neutral surfaces, card radius at most 8px, no cards inside cards, no hero, eyebrow or marketing copy. Spacing in multiples of 4; at most 5 font sizes; letter-spacing 0. Headings say what the area is or what the user can do there. Build empty, loading (skeleton), error and disabled states for every view you touch. Before finishing, render the page with Playwright at 1440, 768 and 390px in light and dark, and fix any text that overflows, overlaps or is cut, any element under 24px that can be clicked, and any colour outside the tokens.
</admin_ui>
```
