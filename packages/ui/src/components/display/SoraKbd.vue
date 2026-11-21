<script setup lang="ts" vapor>
import type { HTMLAttributes } from 'vue'
import type { SoraSize } from '../../types/common.ts'

export interface SoraKbdProps extends /* @vue-ignore */ HTMLAttributes {
  /** Keys of a shortcut, rendered as nested `<kbd>` elements joined by `separator`. */
  keys?: readonly string[] | undefined
  /** Text between keys. */
  separator?: string | undefined
  size?: SoraSize | undefined
}

defineOptions({ name: 'SoraKbd' })

const { keys, separator = '+', size = 'md' } = defineProps<SoraKbdProps>()

defineSlots<{
  /** A single key. Ignored when `keys` is set. */
  default?(): unknown
}>()
</script>

<template>
  <kbd v-if="keys && keys.length > 1" class="sora-kbd-combo" :data-size="size">
    <template v-for="(key, index) in keys" :key="key + index">
      <span v-if="index > 0" class="sora-kbd-combo__separator" aria-hidden="true">{{ separator }}</span>
      <kbd class="sora-kbd" :data-size="size">{{ key }}</kbd>
    </template>
  </kbd>
  <kbd v-else class="sora-kbd" :data-size="size">
    <slot>{{ keys?.[0] }}</slot>
  </kbd>
</template>
