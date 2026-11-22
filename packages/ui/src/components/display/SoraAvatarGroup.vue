<script setup lang="ts" vapor generic="T extends SoraAvatarGroupItem">
import { computed, type HTMLAttributes } from 'vue'
import { useSoraLocale } from '../../composables/use-sora-locale.ts'
import type { SoraSize } from '../../types/common.ts'
import SoraAvatar from './SoraAvatar.vue'

export interface SoraAvatarGroupItem {
  name: string
  src?: string | undefined
  initials?: string | undefined
}

export interface SoraAvatarGroupProps<TItem extends SoraAvatarGroupItem = SoraAvatarGroupItem>
  extends /* @vue-ignore */ HTMLAttributes {
  items: readonly TItem[]
  /** Maximum avatars shown before the remainder collapses into a counter. */
  max?: number | undefined
  size?: SoraSize | undefined
  /** Accessible name of the group, e.g. "Collaborators". */
  label?: string | undefined
}

defineOptions({ name: 'SoraAvatarGroup' })

const { items, max = 4, size, label } = defineProps<SoraAvatarGroupProps<T>>()

defineSlots<{
  /** Replace one avatar. */
  avatar?(props: { item: T; index: number }): unknown
}>()

const { t, formatNumber } = useSoraLocale()
const visible = computed(() => items.slice(0, Math.max(0, max)))
const hidden = computed(() => Math.max(0, items.length - visible.value.length))
</script>

<template>
  <ul class="sora-avatar-group" :aria-label="label" :data-size="size">
    <li v-for="(item, index) in visible" :key="item.name + index" class="sora-avatar-group__item">
      <slot name="avatar" :item="item" :index="index">
        <SoraAvatar :name="item.name" :src="item.src" :initials="item.initials" :size="size" />
      </slot>
    </li>
    <li v-if="hidden > 0" class="sora-avatar-group__item">
      <span class="sora-avatar sora-avatar-group__more" :data-size="size ?? 'md'" data-shape="circle">
        <span aria-hidden="true">+{{ formatNumber(hidden) }}</span>
        <span class="sora-sr-only">{{ t('avatarGroup.more', { count: formatNumber(hidden) }) }}</span>
      </span>
    </li>
  </ul>
</template>
