import { createUiI18n } from '@your-scope/ui/i18n'
import english from '@your-scope/ui/i18n/locales/en'

const app = {
  en: {
    'app.title': 'Packed consumer',
    'app.email': 'Email',
    'app.open': 'Open dialog',
    'app.count': 'Clicked {count}',
  },
  ja: {
    'app.title': 'パック済みコンシューマー',
    'app.email': 'メールアドレス',
    'app.open': 'ダイアログを開く',
    'app.count': '{count} 回クリック',
  },
  ar: {
    'app.title': 'مستهلك الحزمة',
    'app.email': 'البريد الإلكتروني',
    'app.open': 'فتح مربع الحوار',
    'app.count': 'عدد النقرات: {count}',
  },
} as const

/**
 * Library messages come precompiled from the package. This application's own
 * four messages are plain strings, so they are written without placeholders
 * that would need the (dropped) runtime compiler, except `app.count`, which is
 * formatted by hand below.
 */
export const ui = createUiI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en: { ...english, ...app.en } },
  loadLocale: async (locale) => {
    if (locale === 'ja') return { ...(await import('@your-scope/ui/i18n/locales/ja')).default, ...app.ja }
    if (locale === 'ar') return { ...(await import('@your-scope/ui/i18n/locales/ar')).default, ...app.ar }
    return {}
  },
})
