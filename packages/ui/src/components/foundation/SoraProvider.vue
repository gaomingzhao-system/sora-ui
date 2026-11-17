<script setup lang="ts" vapor>
import { computed, provide, watchEffect } from 'vue'
import type { HTMLAttributes } from 'vue'
import type {
  SoraComponentDefaults,
  SoraComponentDefaultsInput,
  SoraDensity,
  SoraMotion,
  SoraRadius,
} from '@your-scope/theme'
import { soraContextKey, useSoraContext } from '../../composables/use-sora-config.ts'
import { directionOf } from '../../internal/translator.ts'
import type { SoraColorModeSetting, SoraDirection } from '../../types/common.ts'
import type { SoraTranslator } from '../../types/config.ts'

export interface SoraProviderProps extends /* @vue-ignore */ HTMLAttributes {
  /** Force a colour scheme for this subtree. Omit to follow the surrounding `color-scheme`. */
  colorMode?: SoraColorModeSetting | undefined
  density?: SoraDensity | undefined
  radius?: SoraRadius | undefined
  motion?: SoraMotion | undefined
  /** Writing direction. Defaults to the direction of `locale` when that is set. */
  dir?: SoraDirection | undefined
  /** BCP 47 tag used for `lang` and `Intl` formatting. */
  locale?: string | undefined
  /** Translator for built-in text (see `@your-scope/ui/i18n`). English is used when omitted. */
  translator?: SoraTranslator | undefined
  /** Component prop defaults for this subtree, merged over the outer ones. */
  defaults?: SoraComponentDefaultsInput | undefined
  /** Custom property overrides, e.g. from `createThemeVars()` in `@your-scope/theme`. */
  themeVars?: Readonly<Record<`--sora-${string}`, string>> | undefined
  /** `self` renders a layout-neutral wrapper; `document` applies everything to `<html>`. */
  target?: 'self' | 'document' | undefined
  /** Wrapper element when `target` is `self`. */
  as?: string | undefined
}

defineOptions({ name: 'SoraProvider', inheritAttrs: false })

const {
  colorMode,
  density,
  radius,
  motion,
  dir,
  locale,
  translator,
  defaults,
  themeVars,
  target = 'self',
  as = 'div',
} = defineProps<SoraProviderProps>()

defineSlots<{ default?(): unknown }>()

const parent = useSoraContext()

const mergedDefaults = computed<SoraComponentDefaults>(() => {
  const outer = parent.defaults.value
  if (!defaults) return outer
  const merged = { ...outer } as { -readonly [K in keyof SoraComponentDefaults]: SoraComponentDefaults[K] }
  for (const key of Object.keys(defaults) as (keyof SoraComponentDefaults)[]) {
    Object.assign(merged, { [key]: { ...outer[key], ...defaults[key] } })
  }
  return merged
})

const resolvedDir = computed<SoraDirection | undefined>(
  () => dir ?? (locale === undefined ? undefined : directionOf(locale)),
)

provide(soraContextKey, {
  defaults: mergedDefaults,
  translator: computed(() => translator ?? parent.translator.value),
  locale: computed(() => locale ?? parent.locale.value),
  dir: computed(() => resolvedDir.value ?? parent.dir.value),
})

const scope = computed(() => ({
  'data-sora-theme': colorMode,
  'data-sora-density': density,
  'data-sora-radius': radius,
  'data-sora-motion': motion,
  dir: resolvedDir.value,
  lang: locale,
}))

// `document` target: mirror the same attributes and variables on <html>, and
// put back whatever was there when the provider goes away.
watchEffect((onCleanup) => {
  if (target !== 'document' || typeof document === 'undefined') return
  const root = document.documentElement
  const restore: (() => void)[] = []

  for (const [name, value] of Object.entries(scope.value)) {
    if (value === undefined) continue
    const previous = root.getAttribute(name)
    root.setAttribute(name, value)
    restore.push(() => (previous === null ? root.removeAttribute(name) : root.setAttribute(name, previous)))
  }
  for (const [name, value] of Object.entries(themeVars ?? {})) {
    const previous = root.style.getPropertyValue(name)
    root.style.setProperty(name, value)
    restore.push(() => (previous ? root.style.setProperty(name, previous) : root.style.removeProperty(name)))
  }

  onCleanup(() => {
    for (const undo of restore) undo()
  })
})
</script>

<template>
  <component
    :is="as"
    v-if="target === 'self'"
    class="sora-provider"
    v-bind="{ ...$attrs, ...scope }"
    :style="themeVars"
  >
    <slot />
  </component>
  <slot v-else />
</template>
