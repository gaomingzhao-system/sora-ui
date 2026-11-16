<script setup lang="ts" vapor>
import { computed } from 'vue'
import type { HTMLAttributes } from 'vue'
import { useUiDefaults } from '../../composables/use-ui-config.ts'
import { useUiLocale } from '../../composables/use-ui-locale.ts'
import { iconClose, iconError, iconInfo, iconSuccess, iconWarning } from '../../internal/icons.ts'
import type { UiColor, UiIconDefinition } from '../../types/common.ts'
import UiIcon from '../foundation/UiIcon.vue'
import UiIconButton from '../actions/UiIconButton.vue'

export interface UiAlertProps extends /* @vue-ignore */ HTMLAttributes {
  color?: UiColor | undefined
  variant?: 'solid' | 'soft' | 'outline' | undefined
  title?: string | undefined
  /** Body text. Use the default slot for rich content. */
  description?: string | undefined
  /** Glyph. Defaults to one matching `color`; pass `null` for none. The glyph is decorative: the text carries the meaning. */
  icon?: UiIconDefinition | null | undefined
  /** Show a dismiss button. Pair with `v-model:open` to control visibility. */
  dismissible?: boolean | undefined
  /**
   * Live-region behaviour. `auto` uses `role="alert"` for error/warning and
   * `role="status"` otherwise; `off` renders a static note (use that for
   * content that is present when the page loads).
   */
  announce?: 'auto' | 'polite' | 'assertive' | 'off' | undefined
}

// The root is conditional (`v-if="open"`), so attributes are bound explicitly.
defineOptions({ name: 'UiAlert', inheritAttrs: false })

const {
  color,
  variant,
  title,
  description,
  icon,
  dismissible = false,
  announce = 'auto',
} = defineProps<UiAlertProps>()

const open = defineModel<boolean>('open', { default: true })
const emit = defineEmits<{
  /** The dismiss button was activated. */
  dismiss: []
}>()

defineSlots<{
  /** Body content (replaces `description`). */
  default?(): unknown
  /** Replaces `title`. */
  title?(): unknown
  /** Replaces the glyph. */
  icon?(): unknown
  /** Buttons or links related to the message. */
  actions?(): unknown
}>()

const defaults = useUiDefaults('alert')
const resolvedColor = computed(() => color ?? defaults().color)
const resolvedVariant = computed(() => variant ?? defaults().variant)
const { t } = useUiLocale()

const ICONS: Readonly<Partial<Record<UiColor, UiIconDefinition>>> = {
  success: iconSuccess,
  warning: iconWarning,
  error: iconError,
}
const resolvedIcon = computed(() => (icon === undefined ? (ICONS[resolvedColor.value] ?? iconInfo) : icon))

const role = computed(() => {
  if (announce === 'off') return undefined
  if (announce === 'assertive') return 'alert'
  if (announce === 'polite') return 'status'
  return resolvedColor.value === 'error' || resolvedColor.value === 'warning' ? 'alert' : 'status'
})

function dismiss(): void {
  open.value = false
  emit('dismiss')
}
</script>

<template>
  <div
    v-if="open"
    v-bind="$attrs"
    class="vui-alert"
    :role="role"
    :data-color="resolvedColor"
    :data-variant="resolvedVariant"
  >
    <span v-if="$slots.icon || resolvedIcon" class="vui-alert__icon" aria-hidden="true">
      <slot name="icon"><UiIcon v-if="resolvedIcon" :icon="resolvedIcon" /></slot>
    </span>
    <div class="vui-alert__content">
      <p v-if="$slots.title || title" class="vui-alert__title">
        <slot name="title">{{ title }}</slot>
      </p>
      <div v-if="$slots.default || description" class="vui-alert__description">
        <slot>{{ description }}</slot>
      </div>
      <div v-if="$slots.actions" class="vui-alert__actions"><slot name="actions" /></div>
    </div>
    <UiIconButton
      v-if="dismissible"
      class="vui-alert__dismiss"
      :label="t('alert.dismiss')"
      :icon="iconClose"
      size="sm"
      variant="ghost"
      :color="resolvedColor"
      @click="dismiss"
    />
  </div>
</template>
