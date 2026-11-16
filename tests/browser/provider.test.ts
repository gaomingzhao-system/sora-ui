import { markRaw, nextTick, reactive, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { createSoraTranslator } from '@your-scope/ui'
import { createPetiteTranslator, createSoraI18n, pseudoLocalize } from '@your-scope/ui/i18n'
import uiEnglish from '@your-scope/ui/i18n/locales/en'
import { mountVapor } from '../helpers/mount-vapor.ts'
import ProviderHarness from './harness/ProviderHarness.vue'
import type { ProviderState } from './harness/ProviderHarness.vue'
import { $, flush, q, until } from './support.ts'

function setup(overrides: Partial<ProviderState> = {}) {
  const state = reactive<ProviderState>({
    colorMode: undefined,
    density: undefined,
    radius: undefined,
    motion: undefined,
    locale: undefined,
    dir: undefined,
    translator: undefined,
    documentProvider: false,
    page: 2,
    ...overrides,
  })
  const view = mountVapor(ProviderHarness, { props: { state } })
  return { state, view }
}

const token = (element: Element, name: string): string =>
  getComputedStyle(element).getPropertyValue(name).trim()

/** Any CSS colour as [r, g, b] (0-255), resolved by the browser itself. */
function rgb(color: string): [number, number, number] {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('no 2d context')
  context.fillStyle = color
  context.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}
const lightness = (color: string): number => {
  const [r, g, b] = rgb(color)
  return (r + g + b) / 3
}
const background = (testId: string): string => getComputedStyle(q(testId)).backgroundColor
/** A colour token as the browser resolves it at `scope` (light-dark(), oklch(), ...). */
function resolved(scope: Element, name: string): [number, number, number] {
  const probe = document.createElement('i')
  probe.style.backgroundColor = `var(${name})`
  scope.append(probe)
  const value = rgb(getComputedStyle(probe).backgroundColor)
  probe.remove()
  return value
}
const paginationLabel = (): string | null => q('pagination').getAttribute('aria-label')
const nextLabel = (): string | null | undefined =>
  q('pagination').querySelector('li:last-child button')?.getAttribute('aria-label')

describe('SoraProvider: scope', () => {
  it('renders a layout-neutral wrapper that only carries what was asked for', async () => {
    const { state } = setup()
    const outer = q('outer')
    expect(outer.tagName).toBe('DIV')
    expect(outer.classList.contains('sora-provider')).toBe(true)
    expect(outer.classList.contains('from-caller')).toBe(true)
    expect(getComputedStyle(outer).display).toBe('contents')
    for (const name of [
      'data-sora-theme',
      'data-sora-density',
      'data-sora-radius',
      'data-sora-motion',
      'dir',
      'lang',
    ]) {
      expect(outer.hasAttribute(name), name).toBe(false)
    }
    expect(q('inner').tagName).toBe('SECTION')
    expect(q('inner').dataset['soraTheme']).toBe('light')

    state.colorMode = 'dark'
    state.density = 'comfortable'
    state.radius = 'none'
    state.motion = 'none'
    await nextTick()
    expect(outer.dataset['soraTheme']).toBe('dark')
    expect(outer.dataset['soraDensity']).toBe('comfortable')
    expect(outer.dataset['soraRadius']).toBe('none')
    expect(outer.dataset['soraMotion']).toBe('none')
  })

  it('switches the colour scheme for its subtree; a nested provider can switch back', async () => {
    const { state } = setup()
    const lightSurface = background('outer-card')
    expect(getComputedStyle(q('outer-card')).colorScheme).not.toBe('dark')

    state.colorMode = 'dark'
    await flush()
    expect(getComputedStyle(q('outer-card')).colorScheme).toBe('dark')
    // The same token resolves to a dark surface with light text inside the dark scope...
    expect(lightness(background('outer-card'))).toBeLessThan(80)
    expect(lightness(getComputedStyle(q('outer-card')).color)).toBeGreaterThan(180)
    // ...while the nested light provider and everything outside keep the light values.
    expect(getComputedStyle(q('inner-card')).colorScheme).toBe('light')
    expect(background('inner-card')).toBe(lightSurface)
    expect(background('plain-card')).toBe(lightSurface)
    expect(lightness(lightSurface)).toBeGreaterThan(200)
  })

  it('switches density, radius and motion through tokens, not component props', async () => {
    const { state } = setup()
    const button = q('outer-button')
    const compactHeight = button.getBoundingClientRect().height
    expect(token(button, '--sora-duration-fast')).toBe('150ms')

    state.density = 'comfortable'
    state.radius = 'none'
    state.motion = 'none'
    await flush()
    expect(button.getBoundingClientRect().height).toBeGreaterThan(compactHeight)
    expect(getComputedStyle(button).borderTopLeftRadius).toBe('0px')
    expect(token(button, '--sora-duration-fast')).toBe('0ms')
    expect(token(button, '--sora-duration-overlay')).toBe('0ms')
    // Outside the provider nothing changed.
    expect(token(q('plain-button'), '--sora-duration-fast')).toBe('150ms')
    expect(getComputedStyle(q('plain-button')).borderTopLeftRadius).not.toBe('0px')

    state.radius = 'lg'
    await flush()
    expect(Number.parseFloat(getComputedStyle(button).borderTopLeftRadius)).toBeGreaterThan(8)
  })

  it('overrides tokens for its subtree only (themeVars)', () => {
    setup()
    expect(token(q('inner-button'), '--sora-primary')).toBe('rgb(1, 2, 3)')
    expect(token(q('outer-button'), '--sora-primary')).not.toBe('rgb(1, 2, 3)')
    expect(q('inner').style.getPropertyValue('--sora-primary')).toBe('rgb(1, 2, 3)')
  })

  it('accepts a partial config through createProviderTheme()', () => {
    setup()
    const violet = q('violet')
    expect(violet.dataset['soraDensity']).toBe('comfortable')
    expect(violet.dataset['soraRadius']).toBe('lg')
    // Only the primary role was mentioned, so only its tokens are overridden.
    expect(violet.style.getPropertyValue('--sora-primary')).not.toBe('')
    expect(violet.style.getPropertyValue('--sora-success')).toBe('')
    expect(token(q('violet-button'), '--sora-primary')).not.toBe(token(q('outer-button'), '--sora-primary'))
    // Violet is clearly not the neutral default: blue dominates, and by a margin.
    const [r, g, b] = resolved(violet, '--sora-primary')
    expect(b).toBeGreaterThan(r + 20)
    expect(b).toBeGreaterThan(g + 20)
    const [nr, ng, nb] = resolved(q('outer'), '--sora-primary')
    expect(Math.max(nr, ng, nb) - Math.min(nr, ng, nb)).toBeLessThan(12)
    expect(q('violet-button').dataset['size']).toBe('sm')
  })

  it('merges component defaults: explicit prop > nearest provider > outer provider > sora.config.ts', () => {
    setup()
    const read = (testId: string): (string | undefined)[] => {
      const { variant, size, color } = q(testId).dataset
      return [variant, size, color]
    }
    expect(read('plain-button')).toEqual(['solid', 'md', 'primary'])
    expect(read('outer-button')).toEqual(['outline', 'lg', 'primary'])
    // The inner provider only overrides the variant; the size still comes from the outer one.
    expect(read('inner-button')).toEqual(['soft', 'lg', 'primary'])
    expect(read('violet-button')).toEqual(['outline', 'sm', 'primary'])
    // Other component families merge independently.
    expect(q('inner-badge').dataset['color']).toBe('success')
  })

  it('derives direction and language from the locale, unless dir is explicit', async () => {
    const { state } = setup({ locale: 'ar' })
    const outer = q('outer')
    expect(outer.getAttribute('lang')).toBe('ar')
    expect(outer.getAttribute('dir')).toBe('rtl')
    expect(getComputedStyle(q('outer-button')).direction).toBe('rtl')
    expect(getComputedStyle(q('plain-button')).direction).toBe('ltr')

    state.locale = 'ja-JP'
    await nextTick()
    expect(outer.getAttribute('lang')).toBe('ja-JP')
    expect(outer.getAttribute('dir')).toBe('ltr')

    state.dir = 'rtl'
    await nextTick()
    expect(outer.getAttribute('dir')).toBe('rtl')

    state.locale = undefined
    state.dir = undefined
    await nextTick()
    expect(outer.hasAttribute('lang')).toBe(false)
    expect(outer.hasAttribute('dir')).toBe(false)
  })
})

describe('SoraProvider: target="document"', () => {
  it('applies its scope to <html>, renders no wrapper, and restores everything on unmount', async () => {
    const root = document.documentElement
    root.setAttribute('lang', 'en')
    root.removeAttribute('dir')
    const { state } = setup({
      documentProvider: true,
      colorMode: 'dark',
      locale: 'ar',
      density: 'comfortable',
    })
    await flush()
    expect(root.dataset['soraTheme']).toBe('dark')
    expect(root.dataset['soraDensity']).toBe('comfortable')
    expect(root.getAttribute('lang')).toBe('ar')
    expect(root.getAttribute('dir')).toBe('rtl')
    expect(root.style.getPropertyValue('--sora-test-token')).toBe('7px')
    expect(getComputedStyle(root).colorScheme).toBe('dark')
    // No wrapper element: the child sits directly in the mount container.
    expect(q('document-child').parentElement?.hasAttribute('data-test-root')).toBe(true)

    state.colorMode = 'light'
    state.locale = 'ja'
    await flush()
    expect(root.dataset['soraTheme']).toBe('light')
    expect(root.getAttribute('lang')).toBe('ja')
    expect(root.getAttribute('dir')).toBe('ltr')

    state.documentProvider = false
    await flush()
    expect(root.hasAttribute('data-sora-theme')).toBe(false)
    expect(root.hasAttribute('data-sora-density')).toBe(false)
    expect(root.getAttribute('lang')).toBe('en')
    expect(root.hasAttribute('dir')).toBe(false)
    expect(root.style.getPropertyValue('--sora-test-token')).toBe('')
  })
})

describe('translators', () => {
  it('uses built-in English without a translator', () => {
    setup()
    expect(paginationLabel()).toBe('Pagination')
    expect(nextLabel()).toBe('Next page')
  })

  it('createSoraTranslator: switches reactively, resolves regional locales and falls back per key', async () => {
    const locale = ref('ja')
    const translator = createSoraTranslator({
      locale,
      messages: {
        ja: { 'pagination.label': 'ページネーション', 'pagination.page': '{page} ページ' },
        de: { 'pagination.label': 'Seitennavigation', 'pagination.next': 'Nächste Seite' },
      },
      fallbackLocale: 'de',
    })
    setup({ translator: markRaw(translator) })
    expect(paginationLabel()).toBe('ページネーション')
    // Placeholders are interpolated.
    expect($('button[aria-label="1 ページ"]', q('pagination')).textContent?.trim()).toBe('1')
    // Not in `ja`: the translator's fallback locale answers...
    expect(nextLabel()).toBe('Nächste Seite')
    // ...and a key nobody knows comes from the library's built-in English.
    expect($('li:first-child button', q('pagination')).getAttribute('aria-label')).toBe('Previous page')

    locale.value = 'de-AT'
    await nextTick()
    expect(paginationLabel()).toBe('Seitennavigation')
    expect(translator.locale).toBe('de-AT')

    locale.value = 'fr'
    await nextTick()
    expect(paginationLabel()).toBe('Seitennavigation')
  })

  it('createSoraI18n: loads locales lazily, once, and updates the components', async () => {
    const loads: string[] = []
    const loaders: Record<string, () => Promise<{ default: Readonly<Record<string, unknown>> }>> = {
      ja: () => import('@your-scope/ui/i18n/locales/ja'),
      ar: () => import('@your-scope/ui/i18n/locales/ar'),
    }
    const ui = createSoraI18n({
      locale: 'en',
      fallbackLocale: 'en',
      messages: { en: uiEnglish },
      loadLocale: (locale) => {
        loads.push(locale)
        const load = loaders[locale]
        if (!load) throw new Error(`no messages for ${locale}`)
        return load()
      },
    })
    setup({ translator: markRaw(ui.translator) })
    expect(ui.locale.value).toBe('en')
    expect(paginationLabel()).toBe('Pagination')
    expect(ui.hasLocale('ja')).toBe(false)

    await ui.setLocale('ja')
    await nextTick()
    expect(ui.locale.value).toBe('ja')
    expect(ui.hasLocale('ja')).toBe(true)
    // Precompiled messages, with interpolation.
    expect(paginationLabel()).toBe('ページネーション')
    expect($('[aria-current="page"]', q('pagination')).getAttribute('aria-label')).toBe(
      '2 ページ、現在のページ',
    )

    // Concurrent requests share one load; a loaded locale is never fetched again.
    await Promise.all([ui.setLocale('ar'), ui.setLocale('ar')])
    await ui.setLocale('ja')
    await ui.setLocale('ar')
    await nextTick()
    expect(loads).toEqual(['ja', 'ar'])
    expect(paginationLabel()).toBe('التنقل بين الصفحات')

    // The writable locale ref switches between loaded locales synchronously.
    ui.locale.value = 'en'
    await nextTick()
    expect(paginationLabel()).toBe('Pagination')

    // A failed load leaves the current locale alone and can be retried.
    await expect(ui.setLocale('xx')).rejects.toThrow('no messages for xx')
    expect(ui.locale.value).toBe('en')
    await expect(ui.setLocale('xx')).rejects.toThrow('no messages for xx')
    expect(loads).toEqual(['ja', 'ar', 'xx', 'xx'])
  })

  it('createPetiteTranslator: unknown keys yield undefined so components fall back to English', async () => {
    const ui = createSoraI18n({
      locale: 'ja',
      fallbackLocale: 'en',
      messages: { ja: { 'pagination.label': 'ページ送り' }, en: { 'app.title': 'Title' } },
    })
    const translator = createPetiteTranslator(ui.i18n)
    expect(translator.locale).toBe('ja')
    expect(translator.translate('pagination.label')).toBe('ページ送り')
    // Known only in the fallback locale.
    expect(translator.translate('app.title')).toBe('Title')
    expect(translator.translate('pagination.next')).toBeUndefined()

    setup({ translator: markRaw(translator) })
    expect(paginationLabel()).toBe('ページ送り')
    expect(nextLabel()).toBe('Next page')

    ui.locale.value = 'en'
    await until(() => paginationLabel() === 'Pagination')
  })

  it('pseudoLocalize keeps placeholders intact and visibly changes the text', () => {
    const pseudo = pseudoLocalize('Page {page} of {total}')
    expect(pseudo).toContain('{page}')
    expect(pseudo).toContain('{total}')
    expect(pseudo).not.toContain('Page')
    expect(pseudo.length).toBeGreaterThan('Page {page} of {total}'.length)
  })
})
