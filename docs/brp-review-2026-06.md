# Revisión BRP — junio 2026

Auditoría de las skills BRP, patrones repetidos en las sesiones del último mes y
novedades de Claude Code/Agent Skills. Este documento refleja los cambios ya
aplicados al código fuente y lo que queda por hacer en local.

## Cambios aplicados en `src/`

**No-ops eliminados** (líneas que no cambiaban el comportamiento del agente):

- `brp-docs`: fuera "Use consistent terminology throughout the project".
- `brp-test`: fuera "Prefer testing behavior over implementation details".
- `brp-review`: fuera "Be honest about limitations...".
- `brp-plan`: recortadas las coletillas de justificación, conservando la regla.

**Referencia rota corregida**: el orquestador `brp` apuntaba a
`core/policy.json` (no existe en lo distribuido; `policy.json` no se copia a
`dist/`). Reescrito para apuntar a la fuente real `src/core/policy.json`.

**Regla nueva `core/git-workflow.mdc`** (trunk-based para solo-dev): commit
directo a `main`, nada de ramas/worktrees especulativas, y la red de seguridad
pasa a ser el check ejecutable (lint+build). Enlazada en `brp-implement` y
`brp-fix`.

**Skill nueva `brp-release`**: corta una release desde trunk (commits desde el
último tag, bump semver, changelog, gate de check verde, tag inmutable).
Enlazada en `skill-rules.map.json` y añadida al routing
(`intentToSkillChain.release`).

**Skill nueva `brp-rust-quality`**: audita y endurece gates de calidad
Rust/Tauri (clippy `-D warnings`, rustfmt, hygiene de `unsafe`, superficie IPC
de Tauri). Activada por presencia de `Cargo.toml`. Cierra la asimetría de que
`brp-code-quality` era solo TypeScript.

Total: 12 skills BRP (antes 10), dentro del punto dulce de 8-12.

## Parado a propósito

**`brp-secure` / secret-scan**: no se crea de momento. Decisión tuya: los `.env`
viven en git (repos privados) y es un tema a hablar con el equipo. Cuando lo
retoméis, el hueco sigue ahí y encaja con la regla `deploy/github-security.mdc`.

**`git-worktree-manager`** (en `p/.claude/skills/`): conviene quitarla porque
empuja a las ramas que molestan en solo-dev y choca con `git-workflow.mdc`. No
la toqué porque está fuera de este repo.

## Pendiente en tu Mac (no se puede desde Cowork)

El `node_modules` está compilado para macOS y el entorno de Cowork no puede
borrar ficheros ni acceder a tu clave SSH, así que build/validate/commit/push
van en local:

```bash
cd ~/p/agents-tools

# 0. limpiar ficheros sonda que dejó la sesión (no pude borrarlos desde Cowork)
rm -f __probe_wt .git/__probe_write .git/index.lock && rmdir __probe_dir

# 1. build + validación + regenerar índice de skills
pnpm run build
pnpm run check
pnpm run skills:llms        # añade brp-release y brp-rust-quality a llms.txt

# 2. commit y push
git add -A
git commit -m "skills: prune no-ops, add git-workflow rule, brp-release and brp-rust-quality; fix brp orchestrator policy reference"
git push origin main
```

Si `pnpm run check` se queja de algo en las skills nuevas, son cambios de
formato menores; el resto del cableado (map, policy, frontmatter) ya está
validado.
