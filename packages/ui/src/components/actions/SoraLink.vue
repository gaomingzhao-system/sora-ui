<script setup lang="ts" vapor>
import { computed, useTemplateRef, type AnchorHTMLAttributes } from 'vue'
import { useSoraDefaults } from '../../composables/use-sora-config.ts'
import { useSoraLocale } from '../../composables/use-sora-locale.ts'
import { iconExternal } from '../../internal/icons.ts'
import type { SoraColor } from '../../types/common.ts'
import SoraIcon from '../foundation/SoraIcon.vue'

export interface SoraLinkProps extends /* @vue-ignore */ Omit<AnchorHTMLAttributes, 'href'> {
  /** Destination. Links navigate; use SoraButton for actions. */
  href: string
  color?: SoraColor | undefined
  underline?: 'always' | 'hover' | 'none' | undefined
  /** Opens in a new tab with `rel="noopener noreferrer"` and says so to assistive technology. */
  external?: boolean | undefined
  /** Renders a non-interactive, `aria-disabled` placeholder link without `href`. */
  disabled?: boolean | undefined
}

defineOptions({ name: 'SoraLink' })

const { href, color, underline = 'always', external = false, disabled = false } = defineProps<SoraLinkProps>()

defineSlots<{ default?(): unknown }>()

const defaults = useSoraDefaults('link')
const resolvedColor = computed(() => color ?? defaults().color)
const { t } = useSoraLocale()
const element = useTemplateRef<HTMLAnchorElement>('element')

defineExpose({
  focus: (options?: FocusOptions) => element.value?.focus(options),
  get element() {
    return element.value
  },
})
</script>

<template>
  <a
    ref="element"
    class="sora-link"
    :href="disabled ? undefined : href"
    :role="disabled ? 'link' : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    :target="external && !disabled ? '_blank' : undefined"
    :rel="external && !disabled ? 'noopener noreferrer' : undefined"
    :data-color="resolvedColor"
    :data-underline="underline"
  >
    <slot />
    <template v-if="external">
      <SoraIcon :icon="iconExternal" class="sora-link__icon" />
      <span class="sora-sr-only">({{ t('link.external') }})</span>
    </template>
  </a>
</template>
