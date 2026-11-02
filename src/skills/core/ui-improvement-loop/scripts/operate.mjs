/* global process, console, document */
// Moved-functions manifest: open each named button, screenshot what it
// reveals, press Escape and report where focus went.
// node operate.mjs <storage-state.json> <path> <out-prefix> <button name>...
// Names match exactly: "Vista" must not hit a "Buscar vista" palette button.
import { chromium } from './playwright.mjs'

export async function operate(argv) {
  const [, , state, path, prefix, ...names] = argv
  const base = process.env.BASE_URL ?? 'http://localhost:3000'
  const browser = await chromium.launch()
  const context = await browser.newContext({
    storageState: state,
    viewport: {
      width: Number(process.env.W ?? 1440),
      height: Number(process.env.H ?? 900),
    },
  })
  const page = await context.newPage()
  await page.goto(base + path, { waitUntil: 'networkidle', timeout: 180000 })
  await page.waitForTimeout(1000)
  for (const [index, name] of names.entries()) {
    await page.getByRole('button', { name, exact: true }).first().click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${prefix}-${index}.png` })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    const focus = await page.evaluate(() =>
      document.activeElement?.textContent?.trim().slice(0, 40),
    )
    console.log(
      JSON.stringify({
        name,
        screenshot: `${prefix}-${index}.png`,
        focusAfterEscape: focus,
      }),
    )
  }
  await browser.close()
}

await operate(process.argv)
