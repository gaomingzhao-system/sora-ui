/**
 * Type tests for the non-component API: theme configuration, translators,
 * toasts and shared types. Type-checked only; nothing here is executed.
 */
import { createPalette, createThemeVars, defineSoraConfig } from '@your-scope/theme'
import type { SoraConfigInput } from '@your-scope/theme'
import { createSoraTranslator, useToast, useSoraLocale } from '@your-scope/ui'
import type { SoraMessageKey, SoraOption, SoraTranslator } from '@your-scope/ui'
import { createSoraI18n } from '@your-scope/ui/i18n'
import type { SoraCompiledMessages } from '@your-scope/ui/i18n'
import compiledJapanese from '@your-scope/ui/i18n/locales/ja'
import japanese from '@your-scope/ui/locales/ja'
import { createProviderTheme } from '@your-scope/ui/theme'

// ------------------------------------------------------------------- theme
defineSoraConfig({
  colors: { primary: 'terracotta', neutral: 'taupe' },
  density: 'comfortable',
  radius: 'lg',
})
// A declared palette becomes a valid colour value.
defineSoraConfig({
  palettes: { brand: createPalette({ hue: 250, chroma: 0.12 }) },
  colors: { primary: 'brand', secondary: 'violet' },
})
// @ts-expect-error values name palettes: this one does not exist
defineSoraConfig({ colors: { primary: 'tangerine' } })
// @ts-expect-error `colors` keys are the seven semantic roles
defineSoraConfig({ colors: { accent: 'blue' } })
// @ts-expect-error unknown density
defineSoraConfig({ density: 'tiny' })
// @ts-expect-error component defaults are typed per component
defineSoraConfig({ defaults: { button: { variant: 'filled' } } })
// @ts-expect-error raw token overrides must be --sora-* custom properties
defineSoraConfig({ tokens: { both: { color: 'red' } } })

const vars = createThemeVars({ colors: { primary: 'violet' } })
const primary: string | undefined = vars['--sora-primary']
// @ts-expect-error only --sora-* keys exist
void vars['--other']
const providerTheme = createProviderTheme({ density: 'comfortable' })
const density: 'compact' | 'comfortable' | undefined = providerTheme.density
const input: SoraConfigInput<'brand'> = { colors: { info: 'brand' } }
void [primary, density, input]

// -------------------------------------------------------------------- i18n
const translator: SoraTranslator = createSoraTranslator({ locale: () => 'ja', messages: { ja: japanese } })
const translated: string | undefined = translator.translate('pagination.page', { page: 2 })
// @ts-expect-error params are strings or numbers
translator.translate('pagination.page', { page: true })
const key: SoraMessageKey = 'dialog.close'
// @ts-expect-error not a library message key
const unknownKey: SoraMessageKey = 'dialog.open'
// Every locale file has exactly the English keys.
const title: string = japanese['form.errorSummary.title']
// @ts-expect-error unknown message
void japanese['nope']
const compiled: SoraCompiledMessages = compiledJapanese

const ui = createSoraI18n({
  locale: 'en',
  messages: { ja: compiledJapanese },
  loadLocale: async (locale) => ({ default: { hello: locale } }),
})
const sameContract: SoraTranslator = ui.translator
const switching: Promise<void> = ui.setLocale('ja')
ui.locale.value = 'ja'
// @ts-expect-error the locale is a string
ui.locale.value = 1
void [translated, key, unknownKey, title, compiled, sameContract, switching]

// ------------------------------------------------------- composables, types
export function insideSetup(): void {
  const { t, dir, locale, formatNumber } = useSoraLocale()
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

const option: SoraOption<'a' | 'b'> = { value: 'a', label: 'A', disabled: true }
// @ts-expect-error the value must be one of the option type
const wrongOption: SoraOption<'a' | 'b'> = { value: 'c', label: 'C' }
void [option, wrongOption]
