import { test, expect } from './fixtures.js'
import { setSvgSource, visitAndApproveStorage } from './helpers.js'

test('SCADA edits persist across SVG export and reload', async ({ page }) => {
  await visitAndApproveStorage(page)
  await expect(page.locator('#tool_scada')).toBeVisible()
  await expect(page.locator('#tool_code_editor')).toBeVisible()
  await setSvgSource(page, `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="640" height="480">
    <g id="process" inkscape:groupmode="layer" inkscape:label="Process">
      <text id="reading" x="100" y="100" font-size="24" inkscape:label='{&quot;attr&quot;:&quot;get&quot;,&quot;tag&quot;:&quot;PUMP.STATUS&quot;}'>d^%5.1f</text>
    </g>
  </svg>`)
  await page.locator('#reading').click()
  await page.locator('#tool_scada').click()
  const panel = page.locator('#scada_panel')
  await expect(panel).toBeVisible()
  const tag = panel.locator('input[type="text"]').first()
  await expect(tag).toHaveValue('PUMP.STATUS')
  await tag.fill('PUMP.NEW_STATUS')
  await tag.press('Tab')
  const saved = await page.evaluate(() => window.svgEditor.svgCanvas.svgCanvasToString())
  expect(saved).toContain('PUMP.NEW_STATUS')
  await panel.locator('#scada_close').click()
  await setSvgSource(page, saved)
  await page.locator('#reading').click()
  await page.locator('#tool_scada').click()
  await expect(panel.locator('input[type="text"]').first()).toHaveValue('PUMP.NEW_STATUS')
  await expect(page.locator('#process')).toHaveAttribute('inkscape:label', 'Process')
  await panel.locator('#scada_close').click()
  await expect(panel).toBeHidden()
})
