<script setup lang="ts" vapor>
import { useTemplateRef } from 'vue'
import PatternInput from './PatternInput.vue'

export interface PatternState {
  value: number | null
  showHint: boolean
  extraClass: string
  describedBy: string | undefined
  refs: (string | null)[]
  changes: number
  as: 'select' | 'div'
  bind: {
    modelValue: number | null
    'onUpdate:modelValue': (value: number | null) => void
  }
}

const { state } = defineProps<{ state: PatternState }>()
const input = useTemplateRef('input')
const options = [
  { value: 1, label: 'One' },
  { value: 2, label: 'Two' },
  { value: 3, label: 'Three' },
] as const

function registerRef(element: Element | null): void {
  state.refs.push(element ? element.tagName : null)
}
defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <PatternInput
    ref="input"
    v-model="state.value"
    label="Count"
    :options="options"
    :as="state.as"
    :class="['from-parent', state.extraClass]"
    style="margin: 1px"
    name="count"
    :aria-describedby="state.describedBy"
    :control-attrs="{ ref: registerRef, 'data-control': 'yes' }"
    @change="state.changes++"
  >
    <template v-if="state.showHint" #hint>hint text</template>
    <template #option="{ option, index }">{{ index }}:{{ option.label }}</template>
  </PatternInput>

  <PatternInput v-bind="state.bind" label="Bound" :options="options" data-second />
</template>
