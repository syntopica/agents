/* global process, console */
// Screenshot one route as a logged-in user.
// node shot.mjs <storage-state.json> <out.png> <path> [width] [height] [fullPage 0|1]
// BASE_URL defaults to http://localhost:3000.
import { chromium } from './playwright.mjs'

export async function shot(argv) {
  const [, , state, out, path, w = '1440', h = '900', full = '0'] = argv
  const base = process.env.BASE_URL ?? 'http://localhost:3000'
  const browser = await chromium.launch()
  const context = await browser.newContext({
    storageState: state,
    viewport: { width: Number(w), height: Number(h) },
    locale: process.env.LOCALE ?? 'es-ES',
  })
  const page = await context.newPage()
  await page.goto(base + path, { waitUntil: 'networkidle', timeout: 180000 })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: out, fullPage: full === '1' })
  console.log(page.url())
  await browser.close()
}

await shot(process.argv)
