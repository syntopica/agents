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

```bash
codex --search exec --skip-git-repo-check --yolo -c 'mcp_servers={}' \
  -c mcp_servers.atrium.enabled=false -c mcp_servers.atrium.required=false \
  "Read prompt.md in the current directory fully and execute it." \
  -i desktop-<screen>.png -i phone-<screen>.png \
  < /dev/null > codex.log 2>&1
```

Run it under `timeout 1200` and wait for it. Inside Orca (`ORCA_TERMINAL_HANDLE`
set) run it in its own Orca tab so the owner can watch it, with `tee codex.log`
instead of the redirect:
`orca terminal create --worktree active --title "Codex: propose <screen>" --command "<command> 2>&1 | tee codex.log"`,
then `orca terminal wait --terminal <handle> --for exit`. The same holds for the
Codex runs of redirect mode (owner request, 2026-10-15). Generated images are
first written under `~/.codex/generated_images/<session>/` and copied by Codex
to the requested path. If a `mockup-*.png` is missing, look there before
re-running. To fix a mockup, `codex exec resume <SESSION_ID>` with the
rejection, not a new run.

## ChatGPT (web) instead of Codex

"usando chatgpt" drives chatgpt.com in Orca's embedded browser, `default`
profile, which holds the owner's ChatGPT login; it takes no focus from the real
Chrome. ChatGPT cannot read the repository, so its `prompt.md` inlines the
brief, drops the "source of these screens" bullet, and asks for the mockups "in
this same reply" instead of as files. Then:

```bash
timeout 1500 python3 -I ~/.claude/skills/design-quality/scripts/chatgpt_propose.py \
  <run-dir> <run-dir>/desktop-<screen>.png <run-dir>/phone-<screen>.png
```

It opens a new chat, attaches each screenshot, sends the prompt, waits for the
answer, and writes `critique.md` (the answer text), `mockup-<n>.png` (every
image ChatGPT generated) and `chat-url.txt`. The tab stays open: corrections go
as a follow-up message in that chat, which keeps its context, rather than a new
run. The script reads ChatGPT's Spanish UI labels (`Enviar`, `Detener`,
`Quitar`, `Imagen generada`, `ChatGPT dijo:`); when it times out, take an
`orca screenshot` of the tab and fix the selector in the script.
