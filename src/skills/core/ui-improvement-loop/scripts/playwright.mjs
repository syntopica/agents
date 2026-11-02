/* global process */
// Resolves playwright-core without making it a dependency of the project
// under test: PLAYWRIGHT_CORE (a directory) wins, then a normal import.
export const { chromium } = process.env.PLAYWRIGHT_CORE
  ? await import(`${process.env.PLAYWRIGHT_CORE.replace(/\/$/, '')}/index.mjs`)
  : await import('playwright-core')
