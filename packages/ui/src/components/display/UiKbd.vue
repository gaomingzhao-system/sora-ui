<script setup lang="ts" vapor>
import type { HTMLAttributes } from 'vue'
import type { UiSize } from '../../types/common.ts'

export interface UiKbdProps extends /* @vue-ignore */ HTMLAttributes {
  /** Keys of a shortcut, rendered as nested `<kbd>` elements joined by `separator`. */
  keys?: readonly string[] | undefined
  /** Text between keys. */
  separator?: string | undefined
  size?: UiSize | undefined
}

defineOptions({ name: 'UiKbd' })

const { keys, separator = '+', size = 'md' } = defineProps<UiKbdProps>()

defineSlots<{
  /** A single key. Ignored when `keys` is set. */
  default?(): unknown
}>()
</script>

<template>
  <kbd v-if="keys && keys.length > 1" class="vui-kbd-combo" :data-size="size">
    <template v-for="(key, index) in keys" :key="key + index">
      <span v-if="index > 0" class="vui-kbd-combo__separator" aria-hidden="true">{{ separator }}</span>
      <kbd class="vui-kbd" :data-size="size">{{ key }}</kbd>
    </template>
  </kbd>
  <kbd v-else class="vui-kbd" :data-size="size">
    <slot>{{ keys?.[0] }}</slot>
  </kbd>
</template>
