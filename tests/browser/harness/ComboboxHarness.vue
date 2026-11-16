<script setup lang="ts" vapor>
import { useTemplateRef } from 'vue'
import { SoraCombobox } from '@your-scope/ui'
import type { SoraOption } from '@your-scope/ui'

export interface ComboboxState {
  value: string | null
  asyncValue: string | null
  selected: (string | null)[]
  submits: number
  /** Resolvers of pending searches, in call order (the test settles them by hand). */
  pending: {
    query: string
    resolve: (options: SoraOption[]) => void
    reject: (error: unknown) => void
    signal: AbortSignal
  }[]
  disabled: boolean
}

const { state } = defineProps<{ state: ComboboxState }>()
const combobox = useTemplateRef('combobox')

const fruits: SoraOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot', description: 'Stone fruit' },
  { value: 'banana', label: 'Banana', disabled: true },
  { value: 'cherry', label: 'Cherry' },
  { value: 'creme', label: 'Crème brûlée' },
]

function search(query: string, signal: AbortSignal): Promise<SoraOption[]> {
  return new Promise((resolve, reject) => {
    state.pending.push({ query, resolve, reject, signal })
  })
}

defineExpose({ combobox: () => combobox.value })
</script>

<template>
  <form data-testid="form" @submit.prevent="state.submits++">
    <SoraCombobox
      ref="combobox"
      v-model="state.value"
      data-testid="combobox"
      :options="fruits"
      label="Fruit"
      hint="Pick one"
      placeholder="Search"
      name="fruit"
      :disabled="state.disabled"
      @select="state.selected.push($event?.value ?? null)"
    />
    <button type="submit" data-testid="submit">submit</button>
  </form>
  <SoraCombobox
    v-model="state.asyncValue"
    data-testid="combobox-async"
    :search="search"
    :debounce="0"
    label="Remote fruit"
  />
</template>
