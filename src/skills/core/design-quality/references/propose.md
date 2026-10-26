# propose mode: brief template, prompt and command

## `docs/ui-brief.md` template

Keep it under a page. The model reads it before every screenshot.

```markdown
# UI brief: <app name>

## What the app is for

<One paragraph: the job the product does, in the user's words.>

## Who uses it

- **<Role, e.g. administrator>**: <what they come to do, how often, on which
  device, how expert they are>.
- **<Role, e.g. end customer>**: <same>.

## Screens

- `<route>`: <the job this screen does, who uses it, the action they take most>.

## Constraints

- <Design system, brand, stack or legal limits the redesign must keep.>
```

## Prompt

Fill the placeholders and save it as `prompt.md` in the run directory. Send it
in English whatever the person's language; the critique comes back in the
person's language.

```text
You are a senior product designer. Improve the UI of the screens in this
directory for the people who actually use them.

Read first:
- brief.md: what the app is for, who uses it and what each screen is for.
- The screenshots (*.png, full-page captures; desktop and phone): <list each
  file with its route and the job of the screen>.
- The source of these screens, read only: <paths in the repository>. Use it to
  know which data and features really exist. Do not modify any file outside
  this directory.

Method:
1. Search the web for 3-4 mature products that already do this same job,
   market leaders that have spent years on it, and have run into the edge
   cases this screen will meet. For each: the URL, the pattern it settled on,
   and the hard case that pattern handles. Then say which patterns fit this
   app's users, brand and data from brief.md, which do not and why, and how
   you adapt them. The goal is their hard-won solutions fitted to us, not a
   copy of any of them.
2. Critique the screens from the seat of the user in brief.md: wasted space,
   irrelevant or badly ordered content, missing explanation, a primary action
   that does not stand out, too many controls, wrong or misleading states. Each
   point must name something visible in a screenshot.
3. Propose a change of approach, not touch-ups: how this screen should work for
   that user, in two or three sentences. Then the concrete changes, ranked by
   how often the user hits each problem.
4. Generate one mockup image per screen with your image generation tool,
   desktop width, showing the interface as you imagine it should be: your own
   vision built from step 3 and the adapted patterns, free to change layout,
   structure and flow, not a restyle of the current screen. Keep the brand
   identity (logo, colours, type) and every real feature; use plausible data
   and label the image "Conceptual mockup". Save each as mockup-<screen>.png in
   this directory.

Write the critique to critique.md in <language>, with these sections: Change of
approach, Problems, Proposal, References and adapted patterns, Mockups (file
names). Do not invent
features the product lacks without marking them "new". Finish by printing the
paths of the files you wrote.
```

For "usando claude", drop step 4 from your own work and send Codex only the
mockup step, with `critique.md` already written: "Read brief.md, critique.md and
the screenshots, then do only this: <step 4>".

## Command

Run it from the run directory. It needs the network for research and images. The
screenshots go in with `-i` as well as on disk. Keep the prompt before the `-i`
flags: `-i` takes several files, so a prompt after it is read as an image.

First read the `codex` skill's fast path and build `codex_mcp_args` in the same
shell. Continue only when its CLI preflight reports `No enabled MCP servers`.
The empty-map override and a fixed Atrium-only override do not establish
isolation from configured servers, plugins and apps.

```bash
codex --search exec --skip-git-repo-check --yolo "${codex_mcp_args[@]}" \
  "Read prompt.md in the current directory fully and execute it." \
  -i desktop-<screen>.png -i phone-<screen>.png \
  < /dev/null > codex.log 2>&1
```

Run it under `timeout 1200` and wait for it. Inside Orca (`ORCA_TERMINAL_HANDLE`
set) delegate it instead as a supervised interactive worker, so the owner sees
Codex's own TUI in a tab and can type into it: `orca orchestration run-create`,
then
`orca orchestration worker-start --spec "Read prompt.md in <run-dir> fully and execute it." --worktree current --agent codex`,
then `orca orchestration check --wait --types "worker_done,escalation,question"`
(full loop in the `codex` skill). The same holds for redirect mode (owner
request, 2026-10-15). Generated images are first written under
`~/.codex/generated_images/<session>/` and copied by Codex to the requested
path. If a `mockup-*.png` is missing, look there before re-running. To fix a
mockup, `codex exec resume <SESSION_ID>` with the rejection, not a new run.

## ChatGPT (web) instead of Codex

"usando chatgpt" drives chatgpt.com in Orca's embedded browser; it takes no
focus from the real Chrome. Which Orca profile holds the ChatGPT login moves: on
2026-10-18 it was `pxpotion`; on 2026-10-19 that profile no longer existed and
`default` (imported from Chrome) was logged in. List the profiles with
`orca tab profile list --json`, open chatgpt.com in the likely one and check for
a `.ProseMirror` composer before a run, then pass its id as
`CHATGPT_ORCA_PROFILE` (unset means `default`). A "timed out waiting for the
composer" means the chosen profile is logged out. ChatGPT cannot read the
repository, so its `prompt.md` inlines the brief, drops the "source of these
screens" bullet, and asks for the mockups "in this same reply" instead of as
files. Ask for the written sections before the images: on 2026-10-15 two of
three runs answered with mockups only and no text, which then took a follow-up
message in the same chat. Then:

```bash
timeout 1500 /opt/homebrew/bin/python3.13 -I ~/.claude/skills/design-quality/scripts/chatgpt_propose.py \
  <run-dir> <run-dir>/desktop-<screen>.png <run-dir>/phone-<screen>.png
```

Run one at a time. Four runs started together on 2026-10-26 each delivered one
of their 2-6 screenshots, and every critique was written about screens ChatGPT
never saw; a single run delivers all of them. The script now fails when the sent
message holds fewer images than it was given.

It opens a new chat, attaches each screenshot, sends the prompt, waits for the
answer, and writes `critique.md` (the answer text), `mockup-<n>.png` (every
image ChatGPT generated) and `chat-url.txt`. The tab stays open: corrections go
as a follow-up message in that chat, which keeps its context, rather than a new
run: `chatgpt_propose.py <run-dir> --followup <page-id> <message.md>` sends it,
waits and rewrites `critique.md` with that reply alone (copy it aside first: on
2026-10-16 a follow-up asking for one missing mockup replaced a 25K critique
with one word) and the mockups; `--collect <page-id>` only re-reads an answered
chat (the page id is in the script's last JSON line or in
`orca tab list --json`). An image-only reply (three of five runs on 2026-10-15)
takes a `--followup` asking for the written sections. A turn that stops at a
plan ending in a literal `end_turn=false` line, with no images, is nudged with
"Continúa" up to twice by the script itself (2026-10-19). Every collect rewrites
`mockup-1..N` from all the images in the chat, in page order, so the numbers
shift between rounds: copy each round's new images to their own names before the
next follow-up. The script reads ChatGPT's Spanish UI labels (`Enviar`,
`Detener`, `Quitar`, `Imagen generada`, `ChatGPT dijo:`); when it times out,
take an `orca screenshot` of the tab and fix the selector in the script.
