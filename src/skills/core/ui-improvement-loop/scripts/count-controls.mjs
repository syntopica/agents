/* global process, console, document, innerHeight */
// C_toolbar: interactive controls visible above the first data row, outside
// the sidebar and the table header. Prints JSON with the count and labels.
// node count-controls.mjs <storage-state.json> <path> [width] [height]
import { chromium } from './playwright.mjs'

export async function countControls(argv) {
  const [, , state, path, w = '1440', h = '900'] = argv
  const base = process.env.BASE_URL ?? 'http://localhost:3000'
  const browser = await chromium.launch()
  const context = await browser.newContext({
    storageState: state,
    viewport: { width: Number(w), height: Number(h) },
  })
  const page = await context.newPage()
  await page.goto(base + path, { waitUntil: 'networkidle', timeout: 180000 })
  await page.waitForTimeout(1000)
  const result = await page.evaluate(() => {
    const main = document.querySelector('main') ?? document.body
    const row =
      main.querySelector('tbody tr') ??
      main.querySelector('[role=row]:not(:first-child)')
    const limit = row ? row.getBoundingClientRect().top : innerHeight
    const controls = [
      ...document.querySelectorAll(
        'button, a[href], input, select, summary, [role=tab], [role=combobox]',
      ),
    ].filter((el) => {
      const r = el.getBoundingClientRect()
      return (
        r.width > 0 &&
        r.height > 0 &&
        r.top < limit &&
        !el.closest('aside, nav[aria-label], thead') &&
        el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
      )
    })
    return {
      controlsAboveData: controls.length,
      firstDataTop: Math.round(limit),
      labels: controls.map((el) =>
        (el.getAttribute('aria-label') ?? el.textContent ?? el.type ?? '')
          .trim()
          .slice(0, 30),
      ),
    }
  })
  console.log(JSON.stringify(result))
  await browser.close()
}

await countControls(process.argv)
