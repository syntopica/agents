#!/usr/bin/env python3
"""Run one propose pass in ChatGPT's web UI through Orca's embedded browser.

Opens a new chat in an Orca browser profile signed in to ChatGPT (the
`CHATGPT_ORCA_PROFILE` profile id, else Orca's default profile), attaches
the screenshots, sends prompt.md, waits for the answer to finish, then writes
critique.md, mockup-<n>.png and chat-url.txt into the run directory.

    python3 chatgpt_propose.py <run-dir> <screenshot.png> [<screenshot.png> ...]

Measured 2026-10-15 against chatgpt.com with the Spanish UI: the composer is
`.ProseMirror`, the send button is `aria-label=Enviar`, the stop button carries
"Detener", generated images have alt "Imagen generada <n>" and are blob: URLs,
and the answer text follows "ChatGPT dijo:" in the last turn.
"""

import base64
import json
import os
import subprocess
import sys
import time
from pathlib import Path

TIMEOUT_S = 1200
POLL_S = 5
# Images keep arriving after the stop button goes away (2026-10-15: a run saved
# no mockups because it read the page between image steps), so a reply is
# settled only when the generated-image count holds for this many polls.
SETTLED_POLLS = 4
BUSY = 'String(!!document.querySelector("button[aria-label*=Detener], [data-testid=stop-button]"))'
# Distinct generated images (blob URLs), leaving out the user's attachments.
IMAGE_SRCS = (
    'JSON.stringify([...new Set([...document.querySelectorAll("img")]'
    '.filter(i => i.naturalWidth > 300 && i.src.startsWith("blob:")'
    ' && i.alt !== "Archivo adjunto del usuario").map(i => i.src))])'
)
# Sent automatically when the first reply is image-only (two of three on
# 2026-10-15), so the critique arrives without a manual --followup.
FOLLOW_UP = (
    "Escribe ahora, en texto, la crítica completa que acompaña a las maquetas: "
    "el cambio de enfoque, los problemas numerados con lo que se ve en cada "
    "captura, las referencias de otros productos con su adaptación y las "
    "funcionalidades nuevas. No generes más imágenes."
)
# ChatGPT can end a turn on a plan with a literal "end_turn=false" line and no
# images ("Ahora genero ... los cinco mockups", 2026-10-19); nothing more comes
# until it is told to go on, so this is sent at most CONTINUE_TRIES times.
STALLED = "end_turn=false"
CONTINUE = "Continúa: genera ahora las imágenes que has anunciado, en esta misma respuesta."
CONTINUE_TRIES = 2
# Clicks the remove button of a chip showing "Error al cargar" and returns its
# label, or "none" when every attachment uploaded.
FAILED_CHIP = (
    "(() => { const e = [...document.querySelectorAll('*')].find(x =>"
    " x.childElementCount === 0 && x.textContent.trim() === 'Error al cargar');"
    " for (let p = e; p; p = p.parentElement) {"
    " const b = p.querySelector('button[aria-label^=Quitar]');"
    " if (b) { const l = b.getAttribute('aria-label'); b.click(); return l } }"
    " return 'none' })()"
)


def orca(*args: str) -> dict:
    out = subprocess.run(
        ["orca", *args, "--json"], capture_output=True, text=True, timeout=120
    )
    data = json.loads(out.stdout or "{}")
    if not data.get("ok"):
        raise RuntimeError(
            f"orca {args[0]} failed: {out.stdout[:400]} {out.stderr[:400]}"
        )
    return data["result"]


def js(page: str, expression: str) -> str:
    return orca("eval", "--page", page, "--expression", expression)["result"]


def wait_for(page: str, expression: str, what: str, limit_s: int) -> None:
    deadline = time.time() + limit_s
    while js(page, expression) != "true":
        if time.time() > deadline:
            raise TimeoutError(f"timed out waiting for {what}")
        time.sleep(POLL_S)


def main() -> None:
    run_dir = Path(sys.argv[1]).resolve()
    if sys.argv[2:3] == ["--followup"]:
        # Ask more in an open chat, e.g. the written critique after an image-only reply.
        send_and_wait(sys.argv[3], Path(sys.argv[4]).read_text())
        nudge_stalled(sys.argv[3])
        collect(run_dir, sys.argv[3])
        return
    if sys.argv[2:3] == ["--collect"]:
        # Re-read an answered chat still open in Orca (its browserPageId) without resending.
        collect(run_dir, sys.argv[3])
        return
    shots = [str(Path(p).resolve()) for p in sys.argv[2:]]
    if not shots:
        sys.exit(
            "usage: chatgpt_propose.py <run-dir> <screenshot.png> [...] | <run-dir> --collect <page-id> | <run-dir> --followup <page-id> <message.md>"
        )
    prompt = (run_dir / "prompt.md").read_text()

    # The `default` profile lost its ChatGPT login on 2026-10-18; the session
    # now lives in the `pxpotion` profile, so the profile is chosen per run.
    profile = os.environ.get("CHATGPT_ORCA_PROFILE")
    create = ["tab", "create", "--url", "https://chatgpt.com/"]
    page = orca(*create, *(["--profile", profile] if profile else []))["browserPageId"]
    wait_for(
        page, 'String(!!document.querySelector(".ProseMirror"))', "the composer", 60
    )

    # One file per upload: a multi-file upload attaches only the first. Count the
    # chips rather than match names, since ChatGPT renames a repeat "name(1).png".
    for n, shot in enumerate(shots, start=1):
        orca("exec", "--page", page, "--command", f"upload input[type=file] {shot}")
        wait_for(
            page,
            f'String(document.querySelectorAll("button[aria-label^=Quitar]").length >= {n})',
            f"attachment {n}",
            120,
        )
    # An upload can fail after its chip appears ("Error al cargar", seen
    # 2026-10-15), which leaves Enviar disabled. Remove the failed chip and
    # upload that file again.
    for _attempt in range(3):
        time.sleep(POLL_S)
        failed = js(page, FAILED_CHIP)
        if failed == "none":
            break
        shot = next(s for s in shots if Path(s).stem in failed)
        orca("exec", "--page", page, "--command", f"upload input[type=file] {shot}")
    else:
        raise RuntimeError("an attachment kept failing to upload")

    send_and_wait(page, prompt, run_dir)
    # Every chip can be present and the sent message still carry one image:
    # four runs started together on 2026-10-26 each delivered 1 of 2-6
    # screenshots, and ChatGPT critiqued screens it never saw. Count what the
    # sent message holds rather than trust the composer.
    sent = int(js(page, 'String(document.querySelectorAll(\'img[alt="Archivo adjunto del usuario"]\').length)'))
    if sent < len(shots):
        raise RuntimeError(
            f"the message carried {sent} of {len(shots)} screenshots; rerun alone, not beside another run"
        )
    nudge_stalled(page)
    if len(read_answer(page)) < 200:
        send_and_wait(page, FOLLOW_UP)
    collect(run_dir, page)


def send_and_wait(page: str, text: str, run_dir: Path | None = None) -> None:
    js(
        page,
        # The composer is the last ProseMirror: an answer's "Escritura" canvas is one too
        # and comes first, so querySelector typed a follow-up into it (2026-10-19).
        "(() => { const e = [...document.querySelectorAll('.ProseMirror')].at(-1); e.focus();"
        f" document.execCommand('insertText', false, {json.dumps(text)}); return 'ok' }})()",
    )
    wait_for(
        page,
        'String(!!document.querySelector("button[aria-label=Enviar]:not([disabled])"))',
        "the send button",
        120,
    )
    js(
        page,
        '(() => { document.querySelector("button[aria-label=Enviar]").click(); return "ok" })()',
    )
    wait_for(
        page,
        'String(!!document.querySelector("button[aria-label*=Detener], [data-testid=stop-button]"))',
        "the answer to start (if the URL is still chatgpt.com/, the prompt was never sent)",
        60,
    )
    # Saved now, not at the end: if the Orca tab dies mid-answer (seen
    # 2026-10-15), the chat can still be reopened and read with --collect.
    if run_dir is not None:
        (run_dir / "chat-url.txt").write_text(js(page, "location.href") + "\n")
    # Finished means no stop button and the same image count for SETTLED_POLLS
    # polls in a row; image tools pause between steps.
    deadline = time.time() + TIMEOUT_S
    stable, last = 0, -1
    while stable < SETTLED_POLLS:
        if time.time() > deadline:
            raise TimeoutError("timed out waiting for the answer to settle")
        time.sleep(POLL_S)
        count = len(json.loads(js(page, IMAGE_SRCS)))
        stable = 0 if js(page, BUSY) == "true" or count != last else stable + 1
        last = count


def nudge_stalled(page: str) -> None:
    """Tell ChatGPT to go on while its last turn stopped at a plan."""
    for _attempt in range(CONTINUE_TRIES):
        if STALLED not in read_answer(page):
            return
        send_and_wait(page, CONTINUE)


def read_answer(page: str) -> str:
    """The text of the last ChatGPT turn."""
    turn = js(
        page,
        '(() => { const t = [...document.querySelectorAll("[data-content-search-turn-key]")].pop();'
        ' return t ? t.innerText : "" })()',
    )
    answer = turn.split("ChatGPT dijo:", 1)[-1].strip()
    if len(answer) >= 200:
        return answer
    # The answer turn can lack the turn-key attribute (seen 2026-10-15); the
    # page text after the last "ChatGPT dijo:" still holds it.
    return js(
        page,
        '(() => { const t = document.body.innerText; const i = t.lastIndexOf("ChatGPT dijo:");'
        ' const e = t.lastIndexOf("ChatGPT puede cometer errores");'
        ' return i < 0 ? "" : t.slice(i + 13, e > i ? e : undefined).trim() })()',
    )


def collect(run_dir: Path, page: str) -> None:
    url = js(page, "location.href")
    answer = read_answer(page)
    if len(answer) < 200:
        print(
            "warning: reply has no written critique even after the follow-up;"
            " send one with --followup",
            file=sys.stderr,
        )
    (run_dir / "critique.md").write_text(answer + "\n")
    (run_dir / "chat-url.txt").write_text(url + "\n")

    # Several images land in one carousel where only the first carries the
    # "Imagen generada" alt (seen 2026-10-15), so collect every distinct blob
    # image that is not the user's own attachment.
    srcs = json.loads(js(page, IMAGE_SRCS))
    count = len(srcs)
    for n, src in enumerate(srcs):
        data_url = js(
            page,
            f"(async () => {{ const b = await (await fetch({json.dumps(src)})).blob();"
            f" return await new Promise(r => {{ const f = new FileReader();"
            f" f.onload = () => r(f.result); f.readAsDataURL(b) }}) }})()",
        )
        (run_dir / f"mockup-{n + 1}.png").write_bytes(
            base64.b64decode(data_url.split(",", 1)[1])
        )

    print(
        json.dumps(
            {"chat": url, "critique_chars": len(answer), "mockups": count, "page": page}
        )
    )


if __name__ == "__main__":
    main()
