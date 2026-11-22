<script setup lang="ts" vapor>
import { computed, provide, type HTMLAttributes } from 'vue'
import type { SoraComponentDefaults } from '@your-scope/theme'
import { soraContextKey, useSoraContext } from '../../composables/use-sora-config.ts'
import type { SoraColor, SoraOrientation, SoraSize, SoraVariant } from '../../types/common.ts'

export interface SoraButtonGroupProps extends /* @vue-ignore */ HTMLAttributes {
  /** Accessible name of the group (use `aria-labelledby` for a visible heading instead). */
  label?: string | undefined
  orientation?: SoraOrientation | undefined
  /** Join the buttons into one segmented control. */
  attached?: boolean | undefined
  /** Default size for buttons inside the group. */
  size?: SoraSize | undefined
  /** Default variant for buttons inside the group. */
  variant?: SoraVariant | undefined
  /** Default colour for buttons inside the group. */
  color?: SoraColor | undefined
}

defineOptions({ name: 'SoraButtonGroup' })

const {
  label,
  orientation = 'horizontal',
  attached = false,
  size,
  variant,
  color,
} = defineProps<SoraButtonGroupProps>()

defineSlots<{ default?(): unknown }>()

// Buttons inside the group pick up the group's size/variant/colour through
// the same defaults channel SoraProvider uses; explicit props still win.
const parent = useSoraContext()
provide(soraContextKey, {
  ...parent,
  defaults: computed<SoraComponentDefaults>(() => {
    const outer = parent.defaults.value
    const override = {
      ...(size === undefined ? {} : { size }),
      ...(variant === undefined ? {} : { variant }),
      ...(color === undefined ? {} : { color }),
    }
    return {
      ...outer,
      button: { ...outer.button, ...override },
      iconButton: { ...outer.iconButton, ...override },
    }
  }),
})
</script>

<template>
  <div
    class="sora-button-group"
    role="group"
    :aria-label="label"
    :data-orientation="orientation"
    :data-attached="attached ? '' : undefined"
  >
    <slot />
  </div>
</template>
