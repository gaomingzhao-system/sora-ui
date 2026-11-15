<script setup lang="ts" vapor>
import { useTemplateRef } from 'vue'
import type { I18n } from 'petite-vue-i18n'
import CompatForm from './CompatForm.vue'
import CompatI18n from './CompatI18n.vue'
import CompatLifecycle from './CompatLifecycle.vue'
import CompatModel from './CompatModel.vue'
import CompatOverlay from './CompatOverlay.vue'
import CompatProps from './CompatProps.vue'
import CompatSlots from './CompatSlots.vue'

export interface CompatState {
  label: string
  size: 'sm' | 'md' | 'lg' | undefined
  count: number
  items: string[]
  text: string
  open: boolean
  showLifecycle: boolean
  tick: number
  log: string[]
  commits: string[]
  keydowns: number
  dialogOpen: boolean
  save: (output: { email: string }) => Promise<void>
  i18n: I18n<Record<string, Record<string, string>>, {}, {}, string, false>
}

const { state } = defineProps<{ state: CompatState }>()
const model = useTemplateRef('model')

defineExpose({ focusModel: () => model.value?.focus() })
</script>

<template>
  <main>
    <CompatProps :label="state.label" :size="state.size" :count="state.count" />

    <CompatSlots :items="state.items">
      <template #header>header {{ state.label }}</template>
      default {{ state.count }}
      <template #item="{ item, index }">{{ index }}-{{ item.toUpperCase() }}</template>
    </CompatSlots>

    <CompatModel
      ref="model"
      v-model="state.text"
      v-model:open="state.open"
      name="nickname"
      autocomplete="nickname"
      aria-describedby="hint-a"
      class="from-parent"
      @keydown="state.keydowns++"
      @commit="state.commits.push($event)"
    />
    <button type="button" data-testid="focus-model" @click="model?.focus()">focus</button>
    <output data-testid="model-echo">{{ state.text }}|{{ state.open }}</output>

    <CompatLifecycle v-if="state.showLifecycle" :log="state.log" :tick="state.tick" />

    <CompatOverlay v-model:open="state.dialogOpen" />
    <CompatForm :save="state.save" />
    <CompatI18n :i18n="state.i18n" />
  </main>
</template>
