import { promises as fs } from 'node:fs'
import { CODEX_AGENTS_DIST_DIR } from '../constants/CODEX_AGENTS_DIST_DIR'
import { DIST_SKILLS_DIR } from '../constants/DIST_SKILLS_DIR'
import { SRC_AGENTS_DIR } from '../constants/SRC_AGENTS_DIR'
import { SRC_HOOKS_DIR } from '../constants/SRC_HOOKS_DIR'
import { compileAgentsForCodex } from '../lib/link/operations/compileAgentsForCodex'
import { buildMarketplaceManifest } from '../lib/plugins/builders/buildMarketplaceManifest'
import { buildPluginManifest } from '../lib/plugins/builders/buildPluginManifest'
import { copyAgentsIntoPluginRoot } from '../lib/plugins/builders/copyAgentsIntoPluginRoot'
import { copyFlatSkillsIntoPluginRoot } from '../lib/plugins/builders/copyFlatSkillsIntoPluginRoot'
import { copyHooksIntoPluginRoot } from '../lib/plugins/builders/copyHooksIntoPluginRoot'
import { readPackageJson } from '../lib/plugins/builders/readPackageJson'
import { COMPILE_PLUGIN_PATHS } from './constants/COMPILE_PLUGIN_PATHS'

export const main = async () => {
  const p = COMPILE_PLUGIN_PATHS

  const pkg = await readPackageJson(p.PACKAGE_JSON_PATH)
  const pluginManifest = buildPluginManifest(pkg)
  const marketplaceManifest = buildMarketplaceManifest(pluginManifest)

  await fs.mkdir(p.CLAUDE_PLUGIN_MANIFEST_DIR, { recursive: true })
  await fs.writeFile(
    p.CLAUDE_PLUGIN_MANIFEST_PATH,
    JSON.stringify(pluginManifest, null, 2),
    'utf8',
  )
  await fs.writeFile(
    p.CLAUDE_PLUGIN_MARKETPLACE_PATH,
    JSON.stringify(marketplaceManifest, null, 2),
    'utf8',
  )

  const copied = await copyFlatSkillsIntoPluginRoot({
    distSkillsDir: DIST_SKILLS_DIR,
    pluginSkillsDir: p.CLAUDE_PLUGIN_SKILLS_DIR,
  })

  const agents = await copyAgentsIntoPluginRoot({
    srcAgentsDir: SRC_AGENTS_DIR,
    pluginAgentsDir: p.CLAUDE_PLUGIN_AGENTS_DIR,
  })
  const codexAgents = await compileAgentsForCodex({
    srcAgentsDir: SRC_AGENTS_DIR,
    outputAgentsDir: CODEX_AGENTS_DIST_DIR,
  })

  const hooksCount = await copyHooksIntoPluginRoot({
    srcHooksDir: SRC_HOOKS_DIR,
    pluginHooksDir: p.CLAUDE_PLUGIN_HOOKS_DIR,
  })

  console.log(
    `Wrote Claude plugin manifest -> ${p.CLAUDE_PLUGIN_MANIFEST_PATH}`,
  )
  console.log(
    `Wrote Claude marketplace manifest -> ${p.CLAUDE_PLUGIN_MARKETPLACE_PATH}`,
  )
  console.log(
    `Copied ${String(copied.length)} skills into ${p.CLAUDE_PLUGIN_SKILLS_DIR}`,
  )
  if (agents.length > 0) {
    console.log(
      `Copied ${String(agents.length)} subagents into ${p.CLAUDE_PLUGIN_AGENTS_DIR}`,
    )
  }
  if (codexAgents.length > 0) {
    console.log(
      `Compiled ${String(codexAgents.length)} custom agents into ${CODEX_AGENTS_DIST_DIR}`,
    )
  }
  if (hooksCount > 0) {
    console.log(
      `Copied ${String(hooksCount)} hook artifacts into ${p.CLAUDE_PLUGIN_HOOKS_DIR}`,
    )
  }
}
