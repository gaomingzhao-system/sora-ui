<script setup lang="ts" vapor>
import { computed } from 'vue'
import type { HTMLAttributes } from 'vue'
import { useSoraDefaults } from '../../composables/use-sora-config.ts'
import { useSoraLocale } from '../../composables/use-sora-locale.ts'
import { iconClose, iconError, iconInfo, iconSuccess, iconWarning } from '../../internal/icons.ts'
import type { SoraColor, SoraIconDefinition } from '../../types/common.ts'
import SoraIcon from '../foundation/SoraIcon.vue'
import SoraIconButton from '../actions/SoraIconButton.vue'

export interface SoraAlertProps extends /* @vue-ignore */ HTMLAttributes {
  color?: SoraColor | undefined
  variant?: 'solid' | 'soft' | 'outline' | undefined
  title?: string | undefined
  /** Body text. Use the default slot for rich content. */
  description?: string | undefined
  /** Glyph. Defaults to one matching `color`; pass `null` for none. The glyph is decorative: the text carries the meaning. */
  icon?: SoraIconDefinition | null | undefined
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
defineOptions({ name: 'SoraAlert', inheritAttrs: false })

const {
  color,
  variant,
  title,
  description,
  icon,
  dismissible = false,
  announce = 'auto',
} = defineProps<SoraAlertProps>()

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

const defaults = useSoraDefaults('alert')
const resolvedColor = computed(() => color ?? defaults().color)
const resolvedVariant = computed(() => variant ?? defaults().variant)
const { t } = useSoraLocale()

const ICONS: Readonly<Partial<Record<SoraColor, SoraIconDefinition>>> = {
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
    class="sora-alert"
    :role="role"
    :data-color="resolvedColor"
    :data-variant="resolvedVariant"
  >
    <span v-if="$slots.icon || resolvedIcon" class="sora-alert__icon" aria-hidden="true">
      <slot name="icon"><SoraIcon v-if="resolvedIcon" :icon="resolvedIcon" /></slot>
    </span>
    <div class="sora-alert__content">
      <p v-if="$slots.title || title" class="sora-alert__title">
        <slot name="title">{{ title }}</slot>
      </p>
      <div v-if="$slots.default || description" class="sora-alert__description">
        <slot>{{ description }}</slot>
      </div>
      <div v-if="$slots.actions" class="sora-alert__actions"><slot name="actions" /></div>
    </div>
    <SoraIconButton
      v-if="dismissible"
      class="sora-alert__dismiss"
      :label="t('alert.dismiss')"
      :icon="iconClose"
      size="sm"
      variant="ghost"
      :color="resolvedColor"
      @click="dismiss"
    />
  </div>
</template>
