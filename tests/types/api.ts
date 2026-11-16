/**
 * Type tests for the non-component API: theme configuration, translators,
 * toasts and shared types. Type-checked only; nothing here is executed.
 */
import { createPalette, createThemeVars, defineUiConfig } from '@your-scope/theme'
import type { UiConfigInput } from '@your-scope/theme'
import { createUiTranslator, useToast, useUiLocale } from '@your-scope/ui'
import type { UiMessageKey, UiOption, UiTranslator } from '@your-scope/ui'
import { createUiI18n } from '@your-scope/ui/i18n'
import type { UiCompiledMessages } from '@your-scope/ui/i18n'
import compiledJapanese from '@your-scope/ui/i18n/locales/ja'
import japanese from '@your-scope/ui/locales/ja'
import { createProviderTheme } from '@your-scope/ui/theme'

// ------------------------------------------------------------------- theme
defineUiConfig({ colors: { primary: 'terracotta', neutral: 'taupe' }, density: 'comfortable', radius: 'lg' })
// A declared palette becomes a valid colour value.
defineUiConfig({
  palettes: { brand: createPalette({ hue: 250, chroma: 0.12 }) },
  colors: { primary: 'brand', secondary: 'violet' },
})
// @ts-expect-error values name palettes: this one does not exist
defineUiConfig({ colors: { primary: 'tangerine' } })
// @ts-expect-error `colors` keys are the seven semantic roles
defineUiConfig({ colors: { accent: 'blue' } })
// @ts-expect-error unknown density
defineUiConfig({ density: 'tiny' })
// @ts-expect-error component defaults are typed per component
defineUiConfig({ defaults: { button: { variant: 'filled' } } })
// @ts-expect-error raw token overrides must be --vui-* custom properties
defineUiConfig({ tokens: { both: { color: 'red' } } })

const vars = createThemeVars({ colors: { primary: 'violet' } })
const primary: string | undefined = vars['--vui-primary']
// @ts-expect-error only --vui-* keys exist
void vars['--other']
const providerTheme = createProviderTheme({ density: 'comfortable' })
const density: 'compact' | 'comfortable' | undefined = providerTheme.density
const input: UiConfigInput<'brand'> = { colors: { info: 'brand' } }
void [primary, density, input]

// -------------------------------------------------------------------- i18n
const translator: UiTranslator = createUiTranslator({ locale: () => 'ja', messages: { ja: japanese } })
const translated: string | undefined = translator.translate('pagination.page', { page: 2 })
// @ts-expect-error params are strings or numbers
translator.translate('pagination.page', { page: true })
const key: UiMessageKey = 'dialog.close'
// @ts-expect-error not a library message key
const unknownKey: UiMessageKey = 'dialog.open'
// Every locale file has exactly the English keys.
const title: string = japanese['form.errorSummary.title']
// @ts-expect-error unknown message
void japanese['nope']
const compiled: UiCompiledMessages = compiledJapanese

const ui = createUiI18n({
  locale: 'en',
  messages: { ja: compiledJapanese },
  loadLocale: async (locale) => ({ default: { hello: locale } }),
})
const sameContract: UiTranslator = ui.translator
const switching: Promise<void> = ui.setLocale('ja')
ui.locale.value = 'ja'
// @ts-expect-error the locale is a string
ui.locale.value = 1
void [translated, key, unknownKey, title, compiled, sameContract, switching]

// ------------------------------------------------------- composables, types
export function insideSetup(): void {
  const { t, dir, locale, formatNumber } = useUiLocale()
  const text: string = t('table.empty')
  const direction: 'ltr' | 'rtl' = dir.value
  const formatted: string = formatNumber(1200, { style: 'percent' })
  void [text, direction, locale.value, formatted]

  const toast = useToast()
  const id: string = toast.add({ title: 'Saved', color: 'success', duration: 0 })
  toast.dismiss(id)
  // @ts-expect-error a toast needs a title
  toast.add({ description: 'No title' })
  // @ts-expect-error unknown colour role
  toast.add({ title: 'Saved', color: 'danger' })
}

const option: UiOption<'a' | 'b'> = { value: 'a', label: 'A', disabled: true }
// @ts-expect-error the value must be one of the option type
const wrongOption: UiOption<'a' | 'b'> = { value: 'c', label: 'C' }
void [option, wrongOption]
