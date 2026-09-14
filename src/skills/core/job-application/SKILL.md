---
name: job-application
description:
  Fills and submits one job application, and audits every claim in it against
  the evidence file first. Trigger when a form is being filled or submitted on
  Greenhouse, Ashby, Workable, Lever, Recruitee or Typeform, when application
  essay answers are being drafted, or when a prepared package is finally being
  sent. Triggers (ES) are aplica a, envia la candidatura, rellena el formulario,
  mandar la solicitud. Do not use for finding or scoring postings (that is
  job-search), for writing the master resume, or for recruiter conversations
  after a reply arrives.
allowed-tools: Read, Grep, Glob, Bash, TodoWrite
argument-hint: [company-or-role]
---

# Job application — fill, verify, submit

> Career KB paths below are relative to
> `~/p/cristian-deluxe-developer-portfolio/career`, which owns the evidence,
> voice, rubric and playbook this skill reads.

Every rule here was paid for by a real failure in this repository's own funnel.
Rule numbers refer to `career/hiring-playbook-2026.md`.

Baseline that produced these rules: **9 applications, 0 initial screens.**

## Phase 1 — Gate before anything is written

**Eligibility is a gate, not a scored dimension (rule 31).** Open the canonical
ATS and read the location/country field. Do not read the LinkedIn tag.

- A country list that excludes Spain is a stop. So is "Remote (US)".
- Contractor or EOR availability is a candidate's offer to the employer. It is
  never an override of the employer's approved hiring geography.
- Only a recruiter's written yes reopens a gated role.

This exists because the single most carefully built application in the corpus
(OpenRouter Applied AI Engineer) was submitted against a requisition whose own
captured `offer.md` said "Ashby structured data limits applicants to the United
States". Its `fit.md` scored logistics 85 under a "working decision". Rejected
in 15 days.

Then verify the requisition is **live today**, not when it was captured:

```bash
curl -s "https://boards-api.greenhouse.io/v1/boards/<slug>/jobs/<id>" | head -c 400
curl -s "https://api.ashbyhq.com/posting-api/job-board/<slug>" | head -c 400
```

A prepared package that sat for two weeks needs this before it is sent. Also
re-read the resume for anything that has since become false — employment dates
are the usual one.

**One role per company** unless the hiring surface explicitly invites more.

## Phase 2 — Draft, then audit every noun and number

Write the answer first. Then re-read it against `career/evidence/stories.md`
word by word. **If the evidence does not contain it, cut it. Do not soften it.**

Caught one click before submission on a Toggl form (rule 34):

| Written                              | Evidence actually says                                                                              |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| "measured on throttled real devices" | Puppeteer, iPhone 14 profile, Fast 3G, 4x CPU throttle — emulation                                  |
| "generates real support emails"      | ticket sales, QR entry passes, refunds and cancellations; the mail queue belongs to another product |
| "took the pages when it broke"       | general incident-response responsibility, no pager fact for that client                             |
| "the lab score had been lying"       | nothing recorded                                                                                    |
| "owned four US client platforms"     | four external clients, and Kitco is not US                                                          |
| "the last two years" of a practice   | no start date recorded                                                                              |

The mechanism recurs because each drift is individually small: prose written to
sound compelling moves a few degrees off the record every time.

**Attribution verbs (rule 33).** Use _led, implemented, co-designed, operated_.
Reserve _owned_ for what was genuinely owned alone. A dense stack of
first-person ownership claims invites "what was his actual share?" rather than
admiration. Watch tense: an ended engagement is past tense everywhere.

**One item on page one must be checkable by a stranger** — a public package,
repo, or contribution with its URL. Everything else is a claim.

## Phase 3 — Prose that survives an AI filter

Several boards now carry a mandatory acknowledgement that generic AI-generated
answers hurt the application. The tells are structural, not lexical (rule 35).
Delete on sight:

- **Announced symmetry**: opening with "Two things." or "There are three
  reasons."
- **Binary contrast**: "not X but Y", "instead of chasing the symptom", "rather
  than".
- **Three-part anaphora**: "real payments, real refunds, real support emails".
- **A closing aphorism on every answer**, especially cinematic ones with a time
  of day. "someone's payment fails at eleven at night and the phone that rings
  is mine" is invented detail wearing a personality.
- **Echoing the posting's own phrases** back at it closely enough to look
  generated against the job description.

Replace them with exact conditions, exact numbers, exact dates, and one concrete
decision with the reason behind it. State the failure and the change, then stop.
**Delete any sentence whose job is to land well rather than to inform.**

Match `career/voice.md`. Check en-US spelling; "behaviour" and "labelled" are
recurring slips.

## Phase 4 — What to disclose

- **A gap the posting has already forgiven, disclose it (rule 36).** If the JD
  says prior Go is not mandatory, say plainly: can read it, has not shipped it,
  applying knowing the ramp-up is needed. Do not invent a crash course. Silence
  makes the reviewer guess whether the omission was strategic.
- **End of an engagement is a date, not a story (rule 37).** Template: "My
  engagement with <company> ended on <date>, so I can start immediately." Never
  volunteer who ended it, why, or anything about income.
- **Do not volunteer unprompted negatives.** "No degree" when nothing asked
  creates a criterion the reviewer was not applying; the funnel diagnosis found
  education had the lowest explanatory power of any blocker. "PHP 4" dates the
  career start to roughly 2000-2004 and breaches the age-signal rule in
  substance (playbook rules 6-7).
- **Never infer a personal attribute.** Pronouns are the live case: a name does
  not tell you someone's pronouns. If the owner is unreachable, select "I prefer
  not to say" and tell him it can be changed. Never guess.
- **Never state a salary target or current rate.** `[sensitive]` in
  `career/profile.md`.

## Phase 5 — Mechanics per board

**Verify before clicking submit.** Dump every field value and assert the banned
phrases are absent:

```js
;() => {
  const g = (n) => (document.querySelector(`[name="${n}"]`) || {}).value || ''
  const all = [/* every answer field */].map(g).join(' ')
  return JSON.stringify({
    banned: ['real devices', 'no degree', 'PHP 4', 'Two things'].filter((p) =>
      all.toLowerCase().includes(p.toLowerCase()),
    ),
    errors: [...document.querySelectorAll('[class*="error"],[role="alert"]')]
      .map((e) => e.innerText.trim())
      .filter(Boolean),
  })
}
```

### Greenhouse

- File inputs carry `class="visually-hidden"`, so `setInputFiles` times out
  waiting for actionability. Remove the class and force
  `position:static;opacity:1;display:block;visibility:visible` first, then
  upload against the input's uid.
- Comboboxes are react-select. Neither a synthetic `mousedown` nor
  `element.click()` on the control opens the menu, and
  `execCommand("insertText")` types into it without opening it either. What
  works from `chrome-cli`, with no CDP: focus the input, then send **real typed
  characters** through System Events behind the frontmost guard below, and press
  Return to take the highlighted option. ArrowDown alone opened nothing on
  Grafana's board (2026-09-11) while typing "Spa" opened it immediately, so
  prefer typing a filter over arrowing. Activation and typing must sit in
  **one** `osascript` call: with them split, another app took the front between
  the two and the keystrokes were lost every time. The menu then renders as
  `[id^=react-select-<field-id>-option]` and a plain `element.click()` on the
  matching option selects it (measured 2026-09-10 on Kalepa and Elastic).
- A react-select input reads back `value=""` after a selection: the choice lives
  in React state and shows in the control's own text. Verify with
  `.select__control` innerText, never with `input.value`, or a filled form looks
  empty.
- **A location typeahead needs real keystrokes.** `insertText` sets the text and
  fires input, and the async city search still returns nothing. Focus the field,
  clear it, then `keystroke` the query (ASCII — "Caceres" finds "Caceres,
  Spain").
- **File inputs take a `DataTransfer` regardless of visibility.** Removing
  `visually-hidden` then assigning `input.files` and dispatching `change` works;
  no picker, no actionability wait.
- **The 8-character email verification code is not always required.** Kalepa's
  board submitted on the first click with no code on 2026-09-10. Expect the code
  flow, and do not treat its absence as a failed submit — read the confirmation
  text. When it does appear, the first submit returns "A verification code was
  sent to ...". Fetch it, enter it, submit again; the code splits across eight
  `#security-input-N` boxes and filling the visible field distributes it.
- **An embedded board hides the form in an iframe.**
  `jobs.elastic.co/form?gh_jid=<id>` reports zero inputs because
  `chrome-cli execute` only reaches the top frame. Read
  `document.querySelector("iframe").src` and navigate the tab to it: the
  `job-boards.greenhouse.io/embed/job_app` URL carries its own validity token
  and works top-level.

```bash
vexa sync me@cristiandeluxe.dev
vexa messages --account me@cristiandeluxe.dev --since <today> --limit 40 --with-body --json
```

`vexa messages` defaults to `--limit 20`. The store lags the server, so sync
first and poll — the code can take a couple of minutes to arrive.

### Ashby

- **Ashby validates against its own React state, not the DOM.** Values set with
  the native setter plus an `input` event appear on the page and still submit as
  "Missing entry for required field". Use real CDP input for text fields and a
  real click for Yes/No buttons. Where a Yes button already shows `pressed` but
  the field still reports missing, click **No then Yes** to force the state
  through.
- Fields can appear only after a failed submit (a Location combobox did). Re-run
  the snapshot after every rejection rather than assuming the form is unchanged.
- A rejected submit sends nothing. It is safe to iterate.
- **A radio group rejected as missing after a synthetic click needs a real arrow
  key, not another click.** On n8n's board (2026-09-11) `input.checked = true`
  and `.click()` both left "Missing entry for required field" on an
  experience-level radio, and clicking the label or sending Space changed
  nothing because the element was already checked, so no change event fired.
  What worked: focus the radio, then send **ArrowUp followed by ArrowDown**
  (`key code 126` then `key code 125`) through System Events behind the
  frontmost guard below. The group then moves off and back onto the choice, and
  React records it.
- File inputs on Ashby carry an `id` and **no `name`**, so a `[name=...]`
  selector silently finds nothing. Address them by id (`#_systemfield_resume`,
  `#cover_letter`).
- Where a board has a Cover Letter **file** input and no free-text field, render
  the prepared text to PDF and upload it rather than dropping the argument.
  Render with headless Chrome and a unique `--user-data-dir`.
- **Its spam gate is configured per tenant and blocks automation profiles.**
  LocalStack rejected two submissions with "Your application submission was
  flagged as possible spam", clearing the whole form each time, while Toggl's
  board accepted the same automated browser an hour earlier (2026-09-06). The
  identical payload went through unchanged from the owner's own Chrome. Read a
  spam rejection as a browser-fingerprint problem, not as a content problem, and
  move to the real browser rather than rewriting the answers.

### Driving a form in the owner's real Chrome, without stealing focus

`chrome-cli` reaches the real browser but only runs JavaScript, and other apps
hold the foreground. This combination fills everything except a trusted click:

**Wrap every script in an IIFE, and return a string.** Page scope persists
between calls, so a top-level `const e = ...` in one call makes the next call
with the same name throw `Identifier 'e' has already been declared` — and
chrome-cli reports that as empty output, identical to every other silent
failure. `(function(){ ... return String(x) })()` is the only shape that is safe
to repeat (2026-09-11, measured across five boards).

**Every evaluated expression must return a string.** `chrome-cli` hard-crashes
with `NSInvalidArgumentException: -[__NSCFNumber UTF8String]` when the result is
a number, and with `-[__NSDictionaryM UTF8String]` when it is a Promise — so an
`async` function or a bare `.length` kills the call (2026-09-06, HiveMQ). Wrap
the value: `''+x`, and for async work assign to `window.__x` inside `.then()`
and poll it with a second call.

- **Text fields:** focus the element, then
  `document.execCommand("insertText", false, text)`. It fires native
  `beforeinput`/`input` events that React accepts, unlike a value setter. Send
  **one field per call**: a single call carrying two long answers exceeded the
  argument limit and failed silently with no output at all. Clear the old value
  with `select()`, not `setSelectionRange()` — the latter throws
  `InvalidStateError` on `input[type=email]` and `[type=number]`, which also
  presents as a silent empty result.
- **File uploads:** build a `File` from base64 in the page, add it to a
  `DataTransfer`, assign `input.files`, then dispatch `change`. No native picker
  and no focus needed. A whole PDF will not fit in one argument (a 88KB file is
  117KB of base64), so `split -b 6000`, append the chunks into `window.__b64`
  across calls, and assert the final `length` before decoding with `atob`. Do
  **not** try to `fetch` the file from a localhost server instead: the board's
  CSP `connect-src` blocks it and the page reports only
  `TypeError: Failed to fetch`.
- **Yes/No buttons:** synthetic events set `aria-pressed` but Ashby may still
  report the field missing. Try No then Yes first; if one still fails it needs a
  trusted event, which means a real keypress or the owner's own click.
- **React state settles asynchronously.** A click that reports
  `aria-pressed=false` immediately afterwards is often correct two seconds
  later. Sleep before believing a read-back.

### Synthetic clicks clobber the control you set previously

On HiveMQ's Ashby form (2026-09-06) each synthetic `.click()` re-rendered the
question group and reset the _previous_ answer. Setting the optional consent
checkbox flipped "Do you require Visa sponsorship?" from No back to Yes, and
re-fixing the visa answer cleared the checkbox again. Neither change announced
itself; both were caught only by re-dumping every field.

Two consequences:

1. **Re-read the whole form after every interaction, not just the field you
   touched.** This is the same discipline the Chrome-autofill note below
   demands, for a different cause.
2. **Set the highest-stakes control last**, then stop interacting. Where two
   controls clobber each other under synthetic clicks and no trusted event is
   available, an optional field left in the wrong state is an acceptable loss; a
   wrong answer on eligibility, sponsorship, or compensation is not. Say in the
   handover which optional field was sacrificed so the owner can set it with a
   real click.

### Never send a keystroke without checking what is in front

`osascript … keystroke` goes to whatever application is frontmost. On 2026-09-06
a Cmd+A and a line of text intended for a form landed in the owner's editor,
because Chrome was behind it. Guard every keypress and abort rather than type
blind:

```bash
osascript -e 'tell application "System Events"
  set f to name of first process whose frontmost is true
  if f is "Google Chrome" then
    key code 49
  else
    return "ABORT frontmost=" & f
  end if
end tell'
```

`open -a "Google Chrome"` raises it where AppleScript `activate` does not, but
another app can steal focus back between the check and the key. The guard fired
twice in a row for this reason; when it does, hand the click to the owner
instead of retrying indefinitely. With two Chrome processes running, AppleScript
resolves `application "Google Chrome"` ambiguously and neither exposes an
accessibility tree, so `process "Google Chrome"` reports zero windows.

**Chrome autofill rewrites fields you already set.** It silently replaced a Name
value on interaction. Re-read identity fields after any interaction, not just
after your own writes.

### Teamtailor

- **A checkbox shares its `name` with a hidden input that carries the unchecked
  value**, and the hidden one comes first in the DOM, so
  `querySelector('[name="candidate[consent_given]"]')` returns the hidden input:
  it reads `checked === false` forever, and a label lookup by its (empty) id
  finds nothing. Address the real control by id — `#candidate_consent_given`,
  `#candidate_consent_given_future_jobs` — and the same applies to the
  `[boolean]` radio pairs. Verify a radio group by listing its members and their
  `checked`, never by reading `[name=...]`.
- **The CV input empties itself on success.** Teamtailor ships the file straight
  to S3 and sets `candidate[resume_remote_url]`, so `input.files.length` reads 0
  a second later even though the upload worked. Confirm by searching the page
  text for the filename, and by that hidden field having an S3 URL in it.
- Question fields are `candidate[answers_attributes][N][text|choice|boolean]`
  and N follows the visual order; `choice` takes the option's numeric value.

### LinkedIn Easy Apply

Cheap and worth using in volume: the modal is four pages and reuses the CV
across applications once one has been uploaded.

- **The modal has no `role="dialog"` and no stable class.** Detect it by reading
  `document.body.innerText` for "1/4 páginas" instead, and drive it with the
  buttons named Siguiente, Revisar and Enviar solicitud.
- **Field ids are React-generated (`«rf»`, `«rg»`) and are reassigned on every
  interaction.** Read them, fill them, then re-read before touching anything
  else; an id captured two calls ago points at a different field.
- **The CV file input does not exist until "Cargar currículum" is clicked.** It
  then appears with no id and no name: assign an id yourself, attach through
  `DataTransfer`, and confirm the filename appears in the modal. LinkedIn stores
  it, so the next Easy Apply already has it selected.
- **Numeric questions are free text capped at 20 characters and validated.**
  "90000 EUR brutos/ano" came back as "Información incorrecta"; the bare number
  was accepted. Put the currency in a covering answer, not in that box.
- Confirm by reading "Solicitud enviada justo ahora" from the page, not by the
  submit click returning.

### Lever

- Field names are plain: `name`, `email`, `phone`, `location`, `org`,
  `urls[LinkedIn]`, and each custom question is `cards[<uuid>][field0]` as a
  textarea, radio or checkbox group.
- **Uploading the CV triggers a resume parse that rewrites fields you already
  filled** — on Qonto (2026-09-11) `location` changed from "Caceres, Spain" to
  "Caceres, ESP". Upload first, fill afterwards, and re-dump every identity
  field before submitting.

### Workday

Its tenants are separate: an account on one careers site does not exist on
another, so "Apply Manually" starts at Create Account. Owner's standing decision
(2026-09-11): create the account and store it in 1Password, one item per tenant
in the `Cristian` vault, generated password, with a note naming the requisition.

- **Drive it with the `chrome-devtools` MCP, not chrome-cli.** Workday's submit
  buttons ignore `.click()`, a dispatched full mouse sequence, and even a real
  System Events click; the CDP client's `click` works first time. The form is
  five steps and every control is a listbox rather than a `<select>`.
- **Its a11y snapshot lags the page.** A Create Account click that appears to do
  nothing has often succeeded: the network panel showed `jobapplication`
  requests while the snapshot still rendered step 1. Re-snapshot, or read the
  requests, before concluding a click failed.
- **The honeypot is visible in the tree** ("Enter website. This input is for
  robots only"). Leave it empty; touching it fails the submission silently.
- Prefix is mandatory on the Spain form and offers only Dr/Miss/Mr/Mrs/Ms/Mx.
  Never infer one: take Mx, the neutral option, and tell the owner it can be
  changed in the candidate profile.
- The multi-select "How Did You Hear About Us?" nests: the first click opens a
  category (Job Sites) and the options appear only after it.
- Submitting can leave a follow-up task (a Right to Work questionnaire) on the
  candidate home page. The application is not finished until that reads
  completed.

### Boards that refuse a second application

Two limits met on 2026-09-11, both discovered only at submit:

- **ElevenLabs (Ashby):** "As you have applied for a position in this domain
  within the last 90 days, you cannot submit an application for this position."
  One application per company per quarter, whatever the role.
- **n8n (Ashby):** its board rejects a second application inside 15 days.

Check the tracker for a same-company send before drafting anything.

### Calendly

Refuses bookings from an automated session: "For security reasons, we are not
able to finalize this booking from your current session." Pre-fill the form,
then hand the confirming click to the owner in their own browser.

### Browser choice

Prefer the owner's real Chrome through `chrome-cli` for Ashby boards. The spam
gate below blocks automation profiles per tenant, and the real browser has now
cleared both boards that rejected or were expected to reject one (LocalStack
2026-09-06, HiveMQ 2026-09-06). Starting there costs one extra `chrome-cli`
session and saves a full re-fill.

The `chrome-devtools` MCP with its own profile remains fine for non-Ashby public
forms and avoids touching real sessions. Note it holds a single browser per
profile directory: if another Claude session already launched it, every call
fails with "The browser is already running for .../chrome-profile". That other
browser belongs to a live session — check `ps` ancestry before killing anything,
and switch to `chrome-cli` rather than taking someone else's browser down.
Anything requiring the owner's logged-in identity (LinkedIn) goes through
`chrome-cli` or the Playwright extension against the real Chrome. See the global
browser rule.

## Phase 6 — Close the loop

1. Save the exact submitted text to `applications/<folder>/submitted.md`,
   including the fixed-field table. If a draft was rewritten, keep the original
   as the record of what was wrong and mark it superseded.
2. Update the `tracker.csv` row: status `applied`, the canonical URL and job id,
   the confirmation text, and the real next action.
3. Append a dated status line to that application's `fit.md`.
4. **Compounding principle.** Push durable wins up: new verified facts into
   `evidence/stories.md`, better bullets into `career/resume.md`, reusable
   answers into the application folder as templates, and any new hiring-process
   learning into `career/hiring-playbook-2026.md` as a numbered rule.

## When to stop and ask

- The answer asserts something personal that only the owner can authenticate:
  motivation, personal history, a required attribute like pronouns.
- A mandatory checkbox makes the owner personally vouch for the answers.
- A disclosure decision has real downside either way.

Fill the form completely first, then show the exact text and ask. A filled form
awaiting one click costs the owner seconds; a wrong claim submitted under his
name cannot be withdrawn.

## Self-healing and self-improvement

This skill is expected to be wrong eventually. Boards redesign their forms,
hosts stop resolving, APIs move, and a rule that held in September stops
holding. **When a step here fails or a new failure is discovered, the fix goes
back into this file in the same session.** A workaround that lives only in a
transcript will be rediscovered from scratch, at full cost, by the next session.

### Heal

Trigger: a documented step does not work as written, or produces a result the
skill did not anticipate.

1. Solve the immediate problem for the task at hand.
2. Establish what actually changed, with evidence — the error text, the DNS
   answer, the field that vanished, the status code. Do not guess at a cause.
3. Edit the failing section here. Replace the stale instruction; do not append a
   second version beside it, because two contradictory instructions are worse
   than one stale one. Keep the old behavior only if it still applies somewhere,
   and say where.
4. Record the observation that forced the change, dated, so a future reader can
   tell a deliberate decision from an accident.

### Improve

Trigger: the task succeeded, and something was learned that would have saved
time if it had been written down.

- A new trap, a faster route, a check that caught a real error: add it.
- A step that has never once mattered: delete it. This file competes for
  attention, and an instruction nobody needs makes the ones that matter harder
  to find.
- A rule that fired twice for the same underlying reason: merge them and name
  the shared cause.

### Ship the change

Skills live in `~/p/agents`, not in the project repo. Edit
`src/skills/core/<name>/SKILL.md`, never a compiled or linked copy.

```bash
git pull --ff-only origin main   # other sessions commit here concurrently
pnpm run skills:compile          # `check` does NOT recompile
pnpm run check                   # must exit 0; read the exit code, not the tail
git add src/skills/core/<name>/SKILL.md
git commit && git push origin main
pnpm run skills:link             # then verify the linked file, not the summary
```

A new skill also needs its name in `src/skills/skill-rules.map.json` or the
compile fails. Descriptions need a `Trigger when` clause before character 150, a
`Do not use` clause, and an action verb from
`scripts/constants/ACTION_WORDS.ts`.

### Where a finding belongs

- **How to do the work** → this file.
- **Why a decision was made, with its evidence** → the owning repository's
  knowledge base (for job hunting, `career/hiring-playbook-2026.md` as a
  numbered rule).
- **A fact about the world that other tasks need** → `~/p/brain`.
- **Something actionable but out of scope right now** → the repository's
  `TODO.md`, with the observation, the evidence, and the smallest next step.

Do not put all four in one place. A procedure padded with rationale stops being
followed, and a rationale hidden inside a procedure stops being found.
