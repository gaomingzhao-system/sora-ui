<script setup lang="ts" vapor>
import { computed, useTemplateRef } from 'vue'
import type { AnchorHTMLAttributes } from 'vue'
import { useUiDefaults } from '../../composables/use-ui-config.ts'
import { useUiLocale } from '../../composables/use-ui-locale.ts'
import { iconExternal } from '../../internal/icons.ts'
import type { UiColor } from '../../types/common.ts'
import UiIcon from '../foundation/UiIcon.vue'

export interface UiLinkProps extends /* @vue-ignore */ Omit<AnchorHTMLAttributes, 'href'> {
  /** Destination. Links navigate; use UiButton for actions. */
  href: string
  color?: UiColor | undefined
  underline?: 'always' | 'hover' | 'none' | undefined
  /** Opens in a new tab with `rel="noopener noreferrer"` and says so to assistive technology. */
  external?: boolean | undefined
  /** Renders a non-interactive, `aria-disabled` placeholder link without `href`. */
  disabled?: boolean | undefined
}

defineOptions({ name: 'UiLink' })

const { href, color, underline = 'always', external = false, disabled = false } = defineProps<UiLinkProps>()

defineSlots<{ default?(): unknown }>()

const defaults = useUiDefaults('link')
const resolvedColor = computed(() => color ?? defaults().color)
const { t } = useUiLocale()
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
    class="vui-link"
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
      <UiIcon :icon="iconExternal" class="vui-link__icon" />
      <span class="vui-sr-only">({{ t('link.external') }})</span>
    </template>
  </a>
</template>
