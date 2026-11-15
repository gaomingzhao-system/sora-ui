import { createUiI18n } from '@your-scope/ui/i18n'
import type { UiI18nMessages } from '@your-scope/ui/i18n'
import uiEnglish from '@your-scope/ui/i18n/locales/en'
import { useUiLocale } from '@your-scope/ui'
import type { UiMessageKey, UiMessageParams } from '@your-scope/ui'
import galleryEnglish from './locales/en.ts?compiled'
import type { GalleryKey } from './locales/en.ts'

export const LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ar', label: 'العربية' },
  { value: 'en-XA', label: 'Pseudo (en-XA)' },
] as const

export type GalleryLocale = (typeof LOCALES)[number]['value']

export function isGalleryLocale(value: string | null): value is GalleryLocale {
  return LOCALES.some((locale) => locale.value === value)
}

// Each locale is one lazily loaded chunk holding the library's and the gallery's messages.
const loaders: Readonly<Record<string, () => Promise<UiI18nMessages>>> = {
  ja: async () => {
    const [ui, gallery] = await Promise.all([
      import('@your-scope/ui/i18n/locales/ja'),
      import('./locales/ja.ts?compiled'),
    ])
    return { ...ui.default, ...gallery.default }
  },
  ar: async () => {
    const [ui, gallery] = await Promise.all([
      import('@your-scope/ui/i18n/locales/ar'),
      import('./locales/ar.ts?compiled'),
    ])
    return { ...ui.default, ...gallery.default }
  },
  'en-XA': async () => {
    const [ui, gallery] = await Promise.all([
      import('@your-scope/ui/i18n/locales/pseudo'),
      import('./locales/pseudo.ts?compiled'),
    ])
    return { ...ui.default, ...gallery.default }
  },
}

/**
 * The gallery's single petite-vue-i18n instance. English is bundled with the
 * entry; every other locale is fetched on first use.
 */
export const galleryI18n = createUiI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en: { ...uiEnglish, ...galleryEnglish } },
  loadLocale: (locale) => loaders[locale]?.() ?? Promise.resolve({}),
})

/** `t()` typed with the gallery's keys (and the library's). */
export function useT(): (key: GalleryKey | UiMessageKey, params?: UiMessageParams) => string {
  return useUiLocale().t
}
