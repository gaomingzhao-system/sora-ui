import { PAGES, expect, expectNoAxeViolations, openGallery, test } from '../support.ts'

test('reduced motion turns every duration off', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openGallery(page, 'components')
  const durations = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement)
    return ['--sora-duration-fast', '--sora-duration-overlay'].map((name) =>
      Number.parseFloat(style.getPropertyValue(name)),
    )
  })
  expect(durations).toEqual([0, 0])

  // An overlay still opens and closes; nothing waits for an animation.
  await page.getByTestId('dialog-open').click()
  const dialog = page.getByRole('dialog', { name: 'Settings' })
  await expect(dialog).toBeVisible()
  const running = await dialog.evaluate(
    (node) =>
      node.getAnimations({ subtree: true }).filter((animation) => {
        const timing = animation.effect?.getComputedTiming()
        return typeof timing?.duration === 'number' && timing.duration > 0
      }).length,
  )
  expect(running).toBe(0)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('with motion allowed, overlays use the token durations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await openGallery(page, 'components')
  const overlay = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--sora-duration-overlay').trim(),
  )
  expect(Number.parseFloat(overlay)).toBeGreaterThan(0)
  // Spring easings settle asymptotically: the visible motion is over well before the token.
  expect(Number.parseFloat(overlay)).toBeLessThanOrEqual(400)
})

test('forced colours keep controls, focus and state visible', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit does not implement forced-colors')
  await page.emulateMedia({ forcedColors: 'active' })
  await openGallery(page, 'components')
  expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true)

  // A solid button still has a visible edge (system colours replace the fill).
  const button = page.locator('#demo-SoraButton .sora-button').first()
  const edge = await button.evaluate((node) => {
    const style = getComputedStyle(node)
    return { width: Number.parseFloat(style.borderTopWidth), style: style.borderTopStyle }
  })
  expect(edge.width).toBeGreaterThan(0)
  expect(edge.style).not.toBe('none')

  // Keyboard focus draws an outline.
  await button.focus()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  const outline = await button.evaluate((node) => {
    const style = getComputedStyle(node)
    return { width: Number.parseFloat(style.outlineWidth), style: style.outlineStyle }
  })
  expect(outline.width).toBeGreaterThan(0)
  expect(outline.style).not.toBe('none')

  // A checked checkbox still shows its mark.
  const checkbox = page.locator('#demo-SoraCheckbox input[type="checkbox"]').first()
  await checkbox.check()
  const mark = page.locator('#demo-SoraCheckbox .sora-check__mark--checked').first()
  await expect(mark).toBeVisible()
})

test('touch pointers get 44px targets', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'coarse-pointer emulation needs Chromium device emulation')
  const baseURL = test.info().project.use.baseURL
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    ...(baseURL === undefined ? {} : { baseURL }),
  })
  const page = await context.newPage()
  await openGallery(page, 'components')
  expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true)

  // Every interactive control of the library offers at least a 44 by 44 CSS pixel target.
  const tooSmall = await page.evaluate(() => {
    const selector = [
      '.sora-button',
      '.sora-check__row',
      '.sora-switch__row',
      '.sora-tabs__tab',
      '.sora-accordion__trigger',
      '.sora-pagination__button',
      '.sora-input',
      '.sora-select',
      '.sora-table__sort',
      '.sora-breadcrumbs__link',
    ].join(',')
    const problems: string[] = []
    for (const element of document.querySelectorAll<HTMLElement>(selector)) {
      const box = element.getBoundingClientRect()
      if (box.width === 0 || box.height === 0) continue
      // Inline text links are exempt from the target-size criterion; block-level controls are not.
      if (box.height < 43.5 || box.width < 43.5) {
        problems.push(`${element.className.split(' ')[0]} ${Math.round(box.width)}x${Math.round(box.height)}`)
      }
    }
    return [...new Set(problems)]
  })
  expect(tooSmall).toEqual([])
  await context.close()
})

test('pages stay clean of axe violations at 200% text size', async ({ page }) => {
  await openGallery(page, 'overview')
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  await expectNoAxeViolations(page)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    ),
  ).toBe(false)
})

test('every page declares its language, direction and a single main landmark', async ({ page }) => {
  for (const name of PAGES) {
    await openGallery(page, name)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    await expect(page.getByRole('main')).toHaveCount(1)
    await expect(page.locator('main h1')).toHaveCount(1)
    await expect(page).toHaveTitle(/.+/)
  }
})
