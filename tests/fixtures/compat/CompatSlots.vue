<script setup lang="ts" vapor>
// 2. Default, named and scoped slots.
defineProps<{ items: readonly string[] }>()
defineSlots<{
  default?(): unknown
  header?(): unknown
  item?(props: { item: string; index: number }): unknown
}>()
</script>

<template>
  <section data-testid="slots">
    <header v-if="$slots.header" data-testid="slot-header"><slot name="header" /></header>
    <div data-testid="slot-default"><slot>fallback</slot></div>
    <ul>
      <li v-for="(item, index) in items" :key="item" data-testid="slot-item">
        <slot name="item" :item="item" :index="index">{{ item }}</slot>
      </li>
    </ul>
  </section>
</template>
