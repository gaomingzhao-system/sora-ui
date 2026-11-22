<script setup lang="ts" vapor>
import { computed, shallowRef, watch, type HTMLAttributes } from 'vue'
import { useSoraDefaults } from '../../composables/use-sora-config.ts'
import { iconUser } from '../../internal/icons.ts'
import type { SoraSize } from '../../types/common.ts'
import SoraIcon from '../foundation/SoraIcon.vue'

export interface SoraAvatarProps extends /* @vue-ignore */ HTMLAttributes {
  /** Image URL. Falls back to initials, then to a generic glyph, if it is missing or fails. */
  src?: string | undefined
  /** Person or entity name: the accessible name and the source of the initials. */
  name?: string | undefined
  /** Explicit initials (otherwise derived from `name`). */
  initials?: string | undefined
  size?: SoraSize | undefined
  shape?: 'circle' | 'square' | undefined
}

defineOptions({ name: 'SoraAvatar' })

const { src, name, initials, size, shape = 'circle' } = defineProps<SoraAvatarProps>()

defineSlots<{
  /** Custom fallback content shown when there is no usable image. */
  fallback?(): unknown
}>()

const defaults = useSoraDefaults('avatar')
const resolvedSize = computed(() => size ?? defaults().size)

const failed = shallowRef(false)
watch(
  () => src,
  () => {
    failed.value = false
  },
)
const showImage = computed(() => Boolean(src) && !failed.value)

const derivedInitials = computed(() => {
  if (initials) return initials
  if (!name) return ''
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = [...(words[0] ?? '')][0] ?? ''
  const last = words.length > 1 ? ([...(words.at(-1) ?? '')][0] ?? '') : ''
  return (first + last).toLocaleUpperCase()
})
</script>

<template>
  <span
    class="sora-avatar"
    :data-size="resolvedSize"
    :data-shape="shape"
    :role="!showImage && name ? 'img' : undefined"
    :aria-label="!showImage && name ? name : undefined"
  >
    <img
      v-if="showImage"
      class="sora-avatar__image"
      :src="src"
      :alt="name ?? ''"
      loading="lazy"
      decoding="async"
      @error="failed = true"
    />
    <slot v-else name="fallback">
      <span v-if="derivedInitials" class="sora-avatar__initials" aria-hidden="true">{{
        derivedInitials
      }}</span>
      <SoraIcon v-else :icon="iconUser" class="sora-avatar__glyph" />
    </slot>
  </span>
</template>
