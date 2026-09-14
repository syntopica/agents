#!/usr/bin/env python3
"""Match a user prompt against the routing table and emit a skill directive.

Reads the UserPromptSubmit hook payload on stdin, writes hookSpecificOutput JSON
on stdout, or nothing when no route matches. Silence is the common case and
costs zero tokens.

Routing anchors on domain nouns rather than verbs. The user's imperative verbs
("mira", "haz", "dame") are too ambiguous to route on: "mira a ver si" means
investigate, "mira los mensajes de" means read comms. Nouns disambiguate.

Each lane fires at most once per session: repeating the same directive on every
matching prompt wastes tokens after the first injection. Fired lanes are
tracked in a per-session temp file; without a session_id the hook stays
stateless and fires every time.
"""

import json
import os
import re
import sys
import tempfile

# Prompts that only acknowledge or resume. Routing these wastes tokens, since
# the work was already established by an earlier turn.
CONTINUATION = re.compile(
    r"^\W*(s[ií]|ok|okay|vale|dale|venga|adelante|perfecto|genial|hecho|gracias|"
    r"sigue|continu[ae]|contin[uú]a|termina|acaba|hazlo|adelante con|"
    r"sí por favor|si por favor|haz lo que|yes|go ahead|continue)\b[\s\W]*$",
    re.I,
)

# Harness-generated payloads, not user intent.
MACHINE = re.compile(r"^\W*<(task-notification|system-reminder|local-command)", re.I)

# (name, directive, pattern). First match wins, so order is priority.
ROUTES = [
    (
        "continuation",
        "Resuming earlier work. Load the project-continuation skill: recover state "
        "from git status, the active plan file, TODO.md, and any handoff document "
        "before acting. Do not ask the user to repeat context they already gave.",
        r"(siguiendo (la|el|nuestra)? ?(conversaci[oó]n|sesi[oó]n|hilo)|"
        r"handoff.{0,20}(prosigue|contin[uú]a|sigue)|"
        r"(la )?(conversaci[oó]n|sesi[oó]n) anterior|se qued[oó] a medias|"
        r"esto se ha quedado a medias|donde lo dejamos|"
        r"lo que (falta|queda|falte) (por )?(hacer|terminar)|"
        r"termina (lo que|los pasos)|contin[uú]a (con|donde)|"
        r"la sesi[oó]n anterior se qued)",
    ),
    (
        "agent-config",
        "Agent-configuration work. Change the durable config (rules, CLAUDE.md, "
        "skills, memory), not just this session, and verify the change actually "
        "loads rather than assuming it does.",
        r"(atrium|"
        r"(actualiza|pon(lo|gas)?|a[ñn]ade) .{0,30}claude\.md|"
        r"claude\.md .{0,20}(actualiz|regla|global)|"
        r"esa regla (hazla|ponla) global|regla global|"
        r"convertir esto en una (regla|skill)|"
        r"(crea|haz|escribe) (una |un )?(regla|skill|hook)\b|"
        r"ponlo como regla|"
        r"(guarda|ingiere|ingerir|ingesta|ingestar) .{0,60}\bbrain\b|"
        r"\b(newsletters?|clip nuevo|posts? de twitter|contenido)\b.{0,60}"
        r"\b(ingerir|ingesta|ingestar|brain|twitter)\b|"
        r"\b(ingestar|ingerir) contenido\b)",
    ),
    (
        "plan",
        "Use superpowers:brainstorming, then superpowers:writing-plans. Do not "
        "start editing before the approach is agreed.",
        r"\b(hazme un plan|haz un plan|dame un plan|crea(r)? un plan|"
        r"dise[ñn]a(r)? (el|un) .{0,12}plan|necesito un plan|roadmap|"
        r"c[oó]mo lo (har[ií]as|enfocar[ií]as)|c[oó]mo podr[ií]a hacer|"
        r"antes de implementar|planifica|"
        r"repensar\w* .{0,30}(flujo|sistema|arquitectura)|"
        r"(flujo|sistema|arquitectura).{0,50}repensar\w*|"
        r"me gustar[ií]a (algo m[aá]s|m[aá]s que|que .{0,50}(fuera|hici[eé]ramos))|"
        r"prefiero que miremos c[oó]mo .{0,40}integrar|"
        r"para .{0,50}(poder ver|decidir qu[eé] hacer)|"
        r"en el futuro .{0,50}(campa[ñn]as|dejamos todo preparado))\b",
    ),
    (
        "invoice-ops",
        "Invoice and tax work. Load the invoice-quarter-close skill for the "
        "method, and verify amounts and status against the live source "
        "(Holded, bank exports); never infer them from stale context.",
        r"\b(factura|facturas|trimestre|iva\b|irpf|holded|movimientos|"
        r"ep[ií]grafe|hacienda|gastos? deducible|"
        r"modelo 30[03]|modelo 111|cierre trimestral)\b",
    ),
    (
        "contract-ops",
        "Contract production. Collect the missing facts before drafting, and "
        "confirm every date, place, fee and party against what the client sent.",
        r"((generador|generar|hacer|redacta\w*|terminar|falta) .{0,25}contratos?|"
        # "contrato a <place>" only. "contratos de datos" is a data contract, and
        # "contratos para X" is too often software talk, so neither routes here.
        r"contratos? a \w+|"
        r"(el )?[uú]ltimo contrato|contratos? (listos|finales)|"
        r"mandarlos (a|al) \w+)",
    ),
    (
        "repo-modernization",
        "Repo modernization. Apply the baseline or migration deliberately, then "
        "run the project check and report what it says.",
        r"(busirocket/baseline|github\.com/busirocket/baseline|"
        r"cambia el proyecto a pnpm|migrar (el proyecto )?a pnpm|"
        r"baseline .{0,60}(estrict|endurec|actualiza|implementa|meter)|"
        r"(implementa|mete|meter|endurec\w*) .{0,40}baseline|"
        r"migrar a typescript ?7|typescript ?7\b)",
    ),
    (
        "traffic-client",
        "Use the brp-traffic-client skill: turn the captured traffic into a "
        "direct HTTP client instead of driving the browser.",
        r"\b(\.har\b|\bhar\b|har file|copy as fetch|copy as curl|devtools network|"
        r"network tab|cdp\b|proxy capture|playwright|puppeteer)\b",
    ),
    (
        "loop",
        "Recurring-check request. Use the /loop skill to schedule the check on "
        "the asked interval instead of promising periodic updates that never "
        "fire.",
        # Added 2026-08-24 from router-audit evidence: five measured prompts ask
        # for a periodic check ("avisame cada 5m", "report cada 10m") and fired
        # no lane. Verb + interval noun keeps plain "cada X" mentions silent.
        r"\b(av[ií]sa\w*|reporta?\w*|tick|pon\w* un check|comprueb\w*|"
        r"monitoriz\w*|chequea\w*)\b"
        r".{0,40}\bcada\b ?(\d+ ?(m|min|mins|minutos?|h|horas?)\b|"
        r"minuto\b|rato\b|poco\b)",
    ),
    (
        "stakeholder-recap",
        "Stakeholder-comms context. Load the stakeholder-recap skill. Read the "
        "channel history first, cross-check claims against commits, and do not "
        "restate what was already sent.",
        r"\b(discord|slack)\b.{0,60}\b(recap|resumen|mensajes|dice|dijo|"
        r"responder|contestar|update)\b|"
        r"\b(recap|resumen)\b.{0,40}\b(discord|slack|nathan|john)\b",
    ),
    (
        "lovable-sync",
        "Lovable design sync. Load the lovable-sync skill: pull the latest "
        "Lovable state, map it against the real app, and wire or port without "
        "deleting working functionality.",
        r"(lovable.{0,60}implementar el dise[ñn]o|"
        r"(conversi[oó]n|paridad|migrando|migrar|sincronizar) .{0,40}lovable|"
        r"dise[ñn]o (de|en) lovable|"
        r"se vea .{0,30}en lovable|"
        r"lovable a (esta app|la app|vexa)\b)",
    ),
    (
        "debug",
        "Use the superpowers:systematic-debugging skill before proposing a fix. "
        "Reproduce first; do not guess at the cause.",
        r"\b(no funciona|no va\b|sigue (sin|igual|fallando|roto)|falla|fallando|"
        r"est[aá] roto|se ha roto|(has|hemos|hab[eé]is|han) roto|se rompi[oó]|"
        r"se rompieron|crashe|petado|se cuelga|"
        r"no carga|no aparece|no sale|no me deja|da error|sale un error|"
        r"sale[n]? mal|aparece[n]? mal|"
        # Added 2026-08-18 from router-audit evidence: these are verbatim phrasings
        # the user actually used that fired no lane at all.
        r"tengo un problema|hay un problema|no reacciona|no inicia|"
        r"no est[aá]n? .{0,20}(linkead\w*|vinculad\w*|asociad\w*)|"
        r"no (soy|somos|es) (capaz|capaces)|\berror(?:es)?\b|"
        r"el ci .{0,20}falla|tarda much[oí]simo|"
        # The trailing \b never matched the inflected forms these stems appear in
        # ("colgado", "bloqueada"), so this branch had been dead since it was written.
        r"se queda (lag\w*|colgad\w*|pillad\w*|bloquead\w*|congelad\w*))\b",
    ),
    (
        "environment-ops",
        "Environment/host work. Confirm which host and environment you are on "
        "before changing anything, and never touch production without saying so.",
        r"((conectate|conéctate|conecta) .{0,20}(ssh|nova\.|servidor)|"
        r"acceso ssh|por ssh\b|"
        r"(monta\w*|montes|levanta\w*) .{0,30}(docker|kubernetes|k8s|dev local)|"
        r"funcione? en local con (orbstack|docker)|"
        r"\bvps\b|desbloquea\w* .{0,30}(ip|nova\.))",
    ),
    (
        "release",
        "Use the brp-release skill: collect commits since the last tag, pick the "
        "semver bump, update changelog, gate on a green check, then tag.",
        r"\b(changelog|release notes|haz(me)? (un|el) release|"
        r"sube la versi[oó]n|bump|semver|taggea|crea (el|un) tag)\b",
    ),
    (
        "docs",
        "Use the brp-docs skill: write for a future reader who lacks this "
        "session's context.",
        r"\b(readme|documenta(ci[oó]n)?|\badr\b|architecture decision|"
        r"escribe (los|las) docs|documenta esto)\b",
    ),
    (
        "frontend",
        "Use the frontend-design skill. Match the existing design system; check "
        "the rendered result rather than assuming the markup is right.",
        # "se ve mal" used to sit in the debug lane, which won the race and sent every
        # visual complaint to systematic-debugging instead of the design skill. Measured
        # 2026-08-18: "el header se ve mal en movil" fired debug, never frontend.
        r"\b(tailwind|\bcss\b|layout|responsive|se ve[n]? (mal|raro|feo|fatal)|"
        r"dise[ñn]o .{0,30}(horrible|anticuado|feo|raro)|"
        r"monitores?.{0,80}(feo|fe[ií]sim|horrible|anticuado|bonito)|"
        r"el dise[ñn]o|la interfaz|\bui\b|landing|maquet|en m[oó]vil|"
        r"navegaci[oó]n|chips?|"
        r"scroll|padding|margin|z-index)\b",
    ),
]

COMPILED = [(name, directive, re.compile(pat, re.I)) for name, directive, pat in ROUTES]

# Several asks in one message: the tail reliably gets dropped.
MULTI_VERB = re.compile(
    r"\b(revisa|mira|arregla|haz|hazme|crea|a[ñn]ade|implementa|pon|dame|busca|"
    r"comprueba|prueba|actualiza|cambia|mueve|borra|documenta|sube|genera|"
    r"termina|conecta|descarga|instala|configura|sincroniza|limpia)\b",
    re.I,
)


def session_state_path(session_id):
    safe = re.sub(r"[^A-Za-z0-9_-]", "", str(session_id))
    if not safe:
        return None
    return os.path.join(tempfile.gettempdir(), f"claude-skill-router-{safe}")


def read_fired_lanes(state_path):
    try:
        with open(state_path) as fh:
            return set(fh.read().split())
    except OSError:
        return set()


def record_fired_lane(state_path, lane):
    try:
        with open(state_path, "a") as fh:
            fh.write(lane + "\n")
    except OSError:
        pass


def build_context(prompt, fired_lanes):
    if MACHINE.match(prompt) or CONTINUATION.match(prompt.strip()):
        return None, None

    lane = None
    notes = []
    for name, directive, pattern in COMPILED:
        if pattern.search(prompt):
            if name not in fired_lanes:
                lane = name
                notes.append(directive)
            break

    if len(set(m.lower() for m in MULTI_VERB.findall(prompt))) >= 3:
        notes.append(
            "This prompt contains several separate asks. Track them as tasks and "
            "confirm every one is done before finishing."
        )

    return lane, " ".join(notes) if notes else None


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return
    prompt = payload.get("prompt") or ""
    if not prompt.strip():
        return

    state_path = session_state_path(payload.get("session_id") or "")
    fired_lanes = read_fired_lanes(state_path) if state_path else set()
    lane, context = build_context(prompt, fired_lanes)
    if not context:
        return
    if lane and state_path:
        record_fired_lane(state_path, lane)

    json.dump(
        {
            "hookSpecificOutput": {
                "hookEventName": "UserPromptSubmit",
                "additionalContext": context,
            }
        },
        sys.stdout,
    )


if __name__ == "__main__":
    main()
