#!/usr/bin/env python3
"""Run one propose pass in ChatGPT's web UI through Orca's embedded browser.

Opens a new chat in the Orca `default` profile (signed in to ChatGPT), attaches
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
import subprocess
import sys
import time
from pathlib import Path

TIMEOUT_S = 1200
POLL_S = 5


def orca(*args: str) -> dict:
    out = subprocess.run(
        ["orca", *args, "--json"], capture_output=True, text=True, timeout=120
    )
    data = json.loads(out.stdout or "{}")
    if not data.get("ok"):
        raise RuntimeError(f"orca {args[0]} failed: {out.stdout[:400]} {out.stderr[:400]}")
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
    shots = [str(Path(p).resolve()) for p in sys.argv[2:]]
    if not shots:
        sys.exit("usage: chatgpt_propose.py <run-dir> <screenshot.png> [...]")
    prompt = (run_dir / "prompt.md").read_text()

    page = orca("tab", "create", "--url", "https://chatgpt.com/")["browserPageId"]
    wait_for(page, 'String(!!document.querySelector(".ProseMirror"))', "the composer", 60)

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

    js(
        page,
        "(() => { const e = document.querySelector('.ProseMirror'); e.focus();"
        f" document.execCommand('insertText', false, {json.dumps(prompt)}); return 'ok' }})()",
    )
    wait_for(
        page,
        'String(!!document.querySelector("button[aria-label=Enviar]:not([disabled])"))',
        "the send button",
        120,
    )
    js(page, '(() => { document.querySelector("button[aria-label=Enviar]").click(); return "ok" })()')
    wait_for(
        page,
        'String(!!document.querySelector("button[aria-label*=Detener], [data-testid=stop-button]"))',
        "the answer to start",
        60,
    )
    # Finished means no stop button on two polls in a row; image tools pause between steps.
    deadline = time.time() + TIMEOUT_S
    idle = 0
    while idle < 2:
        if time.time() > deadline:
            raise TimeoutError("timed out waiting for the answer")
        busy = js(page, 'String(!!document.querySelector("button[aria-label*=Detener], [data-testid=stop-button]"))')
        idle = idle + 1 if busy == "false" else 0
        time.sleep(POLL_S)

    url = js(page, "location.href")
    turn = js(
        page,
        '(() => { const t = [...document.querySelectorAll("[data-content-search-turn-key]")].pop();'
        ' return t ? t.innerText : "" })()',
    )
    answer = turn.split("ChatGPT dijo:", 1)[-1].strip()
    (run_dir / "critique.md").write_text(answer + "\n")
    (run_dir / "chat-url.txt").write_text(url + "\n")

    count = int(js(page, 'String([...document.querySelectorAll("img")].filter(i => i.alt.startsWith("Imagen generada")).length)'))
    for n in range(count):
        data_url = js(
            page,
            "(async () => { const i = [...document.querySelectorAll('img')]"
            f".filter(i => i.alt.startsWith('Imagen generada'))[{n}];"
            " const b = await (await fetch(i.src)).blob();"
            " return await new Promise(r => { const f = new FileReader();"
            " f.onload = () => r(f.result); f.readAsDataURL(b) }) })()",
        )
        (run_dir / f"mockup-{n + 1}.png").write_bytes(base64.b64decode(data_url.split(",", 1)[1]))

    print(json.dumps({"chat": url, "critique_chars": len(answer), "mockups": count, "page": page}))


if __name__ == "__main__":
    main()
