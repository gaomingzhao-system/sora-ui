/**
 * TEMPORARY diagnostic, removed again once the cause is known.
 *
 * Firefox's content process crashes ("Page crashed") while axe scans the forms
 * page after an empty submission (forms.spec.ts). This test narrows down the
 * page condition and the axe rule, and keeps Firefox's own stderr. It always
 * fails so that its report is printed in the CI log.
 */
import { AxeBuilder } from '@axe-core/playwright'
import { devices, firefox, test } from '@playwright/test'
import type { Browser, LaunchOptions, Page } from '@playwright/test'
import { origin } from '../ports.ts'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

test.describe.configure({ retries: 0, timeout: 900_000 })
// Tracing is started explicitly where it is a variable; screenshots would only add noise.
test.use({ trace: 'off', screenshot: 'off' })
test.skip(({ browserName }) => browserName !== 'firefox', 'diagnoses a Firefox-only crash')

interface Scenario {
  name: string
  prepare: (page: Page) => Promise<void>
  reducedMotion?: boolean
  trace?: boolean
}

interface Outcome {
  result: string
  axeMs: number
  log: string[]
}

const summary = (page: Page) => page.getByRole('group', { name: 'There is a problem' })
const fullName = (page: Page) =>
  page.getByTestId('profile-form').getByRole('textbox', { name: 'Full name', exact: true })

async function mouseSubmit(page: Page): Promise<void> {
  await page.getByTestId('profile-submit').click()
  await summary(page).waitFor()
}

/** Deletes every style rule whose selector contains `needle` (nested rules included). */
function removeRules(page: Page, needle: string): Promise<number> {
  return page.evaluate((text) => {
    interface Container {
      cssRules: CSSRuleList
      deleteRule(index: number): void
    }
    let removed = 0
    const visit = (owner: Container): void => {
      for (let index = owner.cssRules.length - 1; index >= 0; index--) {
        const rule = owner.cssRules[index]
        if (!rule || rule instanceof CSSKeyframesRule) continue
        if (rule instanceof CSSStyleRule && rule.selectorText.includes(text)) {
          owner.deleteRule(index)
          removed++
          continue
        }
        if ('cssRules' in rule && 'deleteRule' in rule) visit(rule as unknown as Container)
      }
    }
    for (const sheet of document.styleSheets) visit(sheet)
    return removed
  }, needle)
}

const A: Scenario = { name: 'A mouse submit (as in forms.spec)', prepare: mouseSubmit }
const VARIANTS: Scenario[] = [
  A,
  { name: 'A+trace', prepare: mouseSubmit, trace: true },
  {
    name: 'B mouse submit, then blur',
    prepare: async (page) => {
      await mouseSubmit(page)
      await fullName(page).blur()
    },
  },
  {
    name: 'C mouse submit, pointer moved to 0,0',
    prepare: async (page) => {
      await mouseSubmit(page)
      await page.mouse.move(0, 0)
    },
  },
  {
    name: 'D keyboard submit (Enter in Full name)',
    prepare: async (page) => {
      await fullName(page).press('Enter')
      await summary(page).waitFor()
    },
  },
  { name: 'E no submit, script focus on Full name', prepare: (page) => fullName(page).focus() },
  { name: 'F no submit, click into Full name', prepare: (page) => fullName(page).click() },
  {
    name: 'G mouse submit, summary removed',
    prepare: async (page) => {
      await mouseSubmit(page)
      await page.locator('.sora-error-summary').evaluate((element) => element.remove())
    },
  },
  { name: 'H mouse submit, reduced motion', prepare: mouseSubmit, reducedMotion: true },
  {
    name: 'I mouse submit, no :has() rules',
    prepare: async (page) => {
      await mouseSubmit(page)
      await removeRules(page, ':has(')
    },
  },
  {
    name: 'J mouse submit, no :focus-visible rules',
    prepare: async (page) => {
      await mouseSubmit(page)
      await removeRules(page, ':focus-visible')
    },
  },
]

const INCLUDES = [
  'header',
  'main',
  'form',
  '.sora-error-summary',
  '.sora-field[data-invalid]',
  '.sora-field:not([data-invalid])',
  '.sora-check',
  '.sora-toast-region',
  ':focus',
  'select[aria-invalid]',
  'textarea',
  'input[type="date"]',
  'input[type="number"]',
  '.sora-file',
]

async function scan(
  browser: Browser,
  log: string[],
  scenario: Scenario,
  rules?: readonly string[],
  include?: string,
): Promise<Outcome> {
  const context = await browser.newContext({
    ...devices['Desktop Firefox'],
    baseURL: origin('gallery'),
    reducedMotion: scenario.reducedMotion ? 'reduce' : 'no-preference',
  })
  if (scenario.trace) await context.tracing.start({ screenshots: true, snapshots: true })
  const page = await context.newPage()
  let crashed = false
  page.on('crash', () => {
    crashed = true
  })
  const mark = log.length
  let axeStart = 0
  try {
    await page.goto('/#/forms')
    await page.locator('main h1').waitFor()
    await page.evaluate(() => document.fonts.ready)
    await scenario.prepare(page)
    // About as long as the assertions and the settling wait in forms.spec take.
    await page.waitForTimeout(600)
    let builder = new AxeBuilder({ page })
    builder = rules ? builder.withRules([...rules]) : builder.withTags(TAGS)
    if (include) builder = builder.include(include)
    axeStart = Date.now()
    await builder.analyze()
    return { result: 'ok', axeMs: Date.now() - axeStart, log: [] }
  } catch (error) {
    // Firefox's last words arrive through a pipe, a little after the crash is reported.
    if (crashed) await new Promise((resolve) => setTimeout(resolve, 1500))
    const first = String(error).split('\n')[0] ?? ''
    return {
      result: crashed ? 'CRASH' : `error: ${first.slice(0, 200)}`,
      axeMs: axeStart ? Date.now() - axeStart : -1,
      log: log.slice(mark).slice(-60),
    }
  } finally {
    await context.close().catch(() => undefined)
  }
}

/** The rules a tag-based run executes, in the order axe runs them. */
async function ruleOrder(browser: Browser): Promise<string[]> {
  const context = await browser.newContext({ baseURL: origin('gallery') })
  const page = await context.newPage()
  await page.goto('/#/forms')
  await page.locator('main h1').waitFor()
  await new AxeBuilder({ page }).withRules(['document-title']).analyze()
  const order = await page.evaluate((tags) => {
    interface AxeRule {
      id: string
      preload?: unknown
    }
    const axe = (
      window as unknown as {
        axe: {
          _audit: { rules: AxeRule[] }
          utils: { ruleShouldRun(rule: AxeRule, context: object, options: object): boolean }
        }
      }
    ).axe
    const options = { runOnly: { type: 'tag', values: tags } }
    const selected = axe._audit.rules.filter((rule) => axe.utils.ruleShouldRun(rule, { page: true }, options))
    return [...selected.filter((rule) => !rule.preload), ...selected.filter((rule) => rule.preload)].map(
      (rule) => rule.id,
    )
  }, TAGS)
  await context.close()
  return order
}

function launch(log: string[], options: LaunchOptions = {}): Promise<Browser> {
  return firefox.launch({
    ...options,
    logger: {
      isEnabled: (name) => name === 'browser',
      log: (_name, severity, message) => {
        log.push(`[${severity}] ${String(message)}`)
      },
    },
  })
}

test('diagnose the Firefox crash during the axe scan of the forms page', async () => {
  const report: string[] = []
  const write = (line: string): void => {
    report.push(line)
    console.log(line)
  }
  const describe = (label: string, outcome: Outcome): void => {
    write(`${label.padEnd(60)} ${outcome.result}  (axe ${outcome.axeMs} ms)`)
    if (outcome.result !== 'ok' && outcome.log.length > 0) {
      write('  firefox output before it:')
      for (const line of outcome.log) write(`    ${line}`)
    }
  }

  const log: string[] = []
  const browser = await launch(log)
  try {
    write(`Firefox ${browser.version()}`)
    write('--- full scan per page condition')
    let printedLog = false
    for (const scenario of VARIANTS) {
      const outcome = await scan(browser, log, scenario)
      // Firefox's output is printed once, for the first crash.
      describe(scenario.name, printedLog ? { ...outcome, log: [] } : outcome)
      if (outcome.result !== 'ok') printedLog = true
    }

    const order = await ruleOrder(browser)
    write(`--- ${order.length} rules, in run order: ${order.join(' ')}`)
    const crashes = async (count: number): Promise<boolean> =>
      (await scan(browser, log, A, order.slice(0, count))).result === 'CRASH'
    if (await crashes(order.length)) {
      // Smallest prefix of the rule list that still crashes.
      let low = 1
      let high = order.length
      while (low < high) {
        const middle = Math.floor((low + high) / 2)
        if (await crashes(middle)) high = middle
        else low = middle + 1
        write(`  prefix bisect: [${low}, ${high}]`)
      }
      const culprit = order[low - 1] ?? ''
      write(`--- first crashing prefix ends with rule "${culprit}" (#${low})`)
      const alone = await scan(browser, log, A, [culprit])
      describe(`  "${culprit}" alone, condition A`, alone)
      describe(`  rules before "${culprit}" only`, await scan(browser, log, A, order.slice(0, low - 1)))
      // Narrow down with the smallest rule set known to crash.
      const rules = alone.result === 'CRASH' ? [culprit] : order.slice(0, low)
      const label = rules.length === 1 ? `"${culprit}" alone` : `rules up to "${culprit}"`
      for (const include of INCLUDES) {
        describe(`  ${label}, include ${include}`, await scan(browser, log, A, rules, include))
      }
      for (const scenario of VARIANTS.slice(2)) {
        describe(`  ${label}, ${scenario.name}`, await scan(browser, log, scenario, rules))
      }
    } else {
      write('--- the full rule list did not crash in this browser; no bisect')
    }
  } finally {
    await browser.close().catch(() => undefined)
  }

  const telling = /MOZ_|assert|sandbox|crash|SIG[A-Z]|OOM|abort|panic|fatal/i
  const notable = [...new Set(log.filter((line) => telling.test(line)))].slice(0, 80)
  write(`--- notable Firefox output (${notable.length} distinct lines)`)
  for (const line of notable) write(`    ${line}`)

  for (const [label, options] of [
    ['caret does not blink', { firefoxUserPrefs: { 'ui.caretBlinkTime': -1 } }],
    ['content sandbox off', { env: { ...process.env, MOZ_DISABLE_CONTENT_SANDBOX: '1' } }],
  ] as const) {
    const other: string[] = []
    const variant = await launch(other, options)
    try {
      describe(`${A.name}, ${label}`, await scan(variant, other, A))
    } finally {
      await variant.close().catch(() => undefined)
    }
  }

  throw new Error(`Diagnostic report (temporary test, always fails):\n${report.join('\n')}`)
})
