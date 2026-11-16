<script setup lang="ts" vapor>
import { computed, provide } from 'vue'
import type { HTMLAttributes } from 'vue'
import type { UiComponentDefaults } from '@your-scope/theme'
import { uiContextKey, useUiContext } from '../../composables/use-ui-config.ts'
import type { UiColor, UiOrientation, UiSize, UiVariant } from '../../types/common.ts'

export interface UiButtonGroupProps extends /* @vue-ignore */ HTMLAttributes {
  /** Accessible name of the group (use `aria-labelledby` for a visible heading instead). */
  label?: string | undefined
  orientation?: UiOrientation | undefined
  /** Join the buttons into one segmented control. */
  attached?: boolean | undefined
  /** Default size for buttons inside the group. */
  size?: UiSize | undefined
  /** Default variant for buttons inside the group. */
  variant?: UiVariant | undefined
  /** Default colour for buttons inside the group. */
  color?: UiColor | undefined
}

defineOptions({ name: 'UiButtonGroup' })

const {
  label,
  orientation = 'horizontal',
  attached = false,
  size,
  variant,
  color,
} = defineProps<UiButtonGroupProps>()

defineSlots<{ default?(): unknown }>()

// Buttons inside the group pick up the group's size/variant/colour through
// the same defaults channel UiProvider uses; explicit props still win.
const parent = useUiContext()
provide(uiContextKey, {
  ...parent,
  defaults: computed<UiComponentDefaults>(() => {
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
    class="vui-button-group"
    role="group"
    :aria-label="label"
    :data-orientation="orientation"
    :data-attached="attached ? '' : undefined"
  >
    <slot />
  </div>
</template>
