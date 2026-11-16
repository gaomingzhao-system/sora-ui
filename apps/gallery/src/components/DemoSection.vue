<script setup lang="ts" vapor>
import { computed } from 'vue'
import { UiBadge } from '@your-scope/ui'
import { componentManifest } from '../../../../packages/ui/src/components.manifest.ts'
import { useT } from '../i18n.ts'

/** One catalogue entry: heading, reference text from the manifest, and the live demo. */
const { name } = defineProps<{ name: string }>()
defineSlots<{ default?(): unknown }>()

const t = useT()
const entry = computed(() => componentManifest.find((candidate) => candidate.name === name))
</script>

<template>
  <section
    :id="`demo-${name}`"
    class="grid gap-3 border-t border-vui-border py-5 first:border-t-0"
    :data-demo="name"
  >
    <header class="flex flex-wrap items-center gap-2">
      <h3 class="font-vui-mono text-vui-md font-semibold">{{ name }}</h3>
      <UiBadge v-if="entry" size="sm" variant="outline">{{ t(`category.${entry.category}`) }}</UiBadge>
    </header>
    <!-- Reference text comes from the manifest and is English: marked as such for assistive technology. -->
    <p v-if="entry" class="g-reference max-w-prose" lang="en" dir="ltr">{{ entry.summary }}</p>
    <div class="min-w-0"><slot /></div>
  </section>
</template>
