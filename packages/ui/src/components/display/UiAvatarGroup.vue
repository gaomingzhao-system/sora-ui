<script setup lang="ts" vapor generic="T extends UiAvatarGroupItem">
import { computed } from 'vue'
import type { HTMLAttributes } from 'vue'
import { useUiLocale } from '../../composables/use-ui-locale.ts'
import type { UiSize } from '../../types/common.ts'
import UiAvatar from './UiAvatar.vue'

export interface UiAvatarGroupItem {
  name: string
  src?: string | undefined
  initials?: string | undefined
}

export interface UiAvatarGroupProps<TItem extends UiAvatarGroupItem = UiAvatarGroupItem>
  extends /* @vue-ignore */ HTMLAttributes {
  items: readonly TItem[]
  /** Maximum avatars shown before the remainder collapses into a counter. */
  max?: number | undefined
  size?: UiSize | undefined
  /** Accessible name of the group, e.g. "Collaborators". */
  label?: string | undefined
}

defineOptions({ name: 'UiAvatarGroup' })

const { items, max = 4, size, label } = defineProps<UiAvatarGroupProps<T>>()

defineSlots<{
  /** Replace one avatar. */
  avatar?(props: { item: T; index: number }): unknown
}>()

const { t, formatNumber } = useUiLocale()
const visible = computed(() => items.slice(0, Math.max(0, max)))
const hidden = computed(() => Math.max(0, items.length - visible.value.length))
</script>

<template>
  <ul class="vui-avatar-group" :aria-label="label" :data-size="size">
    <li v-for="(item, index) in visible" :key="item.name + index" class="vui-avatar-group__item">
      <slot name="avatar" :item="item" :index="index">
        <UiAvatar :name="item.name" :src="item.src" :initials="item.initials" :size="size" />
      </slot>
    </li>
    <li v-if="hidden > 0" class="vui-avatar-group__item">
      <span class="vui-avatar vui-avatar-group__more" :data-size="size ?? 'md'" data-shape="circle">
        <span aria-hidden="true">+{{ formatNumber(hidden) }}</span>
        <span class="vui-sr-only">{{ t('avatarGroup.more', { count: formatNumber(hidden) }) }}</span>
      </span>
    </li>
  </ul>
</template>
