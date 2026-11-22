<script setup lang="ts" vapor generic="T extends string | number">
// Composes PatternField, splits attrs, merges a caller ref with its own, and
// is generic over the model type.
import { computed, useAttrs, useTemplateRef, type SelectHTMLAttributes } from 'vue'
import PatternField from './PatternField.vue'
import PatternTone from './PatternTone.vue'

export interface PatternInputProps<TValue extends string | number>
  extends /* @vue-ignore */ Omit<SelectHTMLAttributes, 'value'> {
  label: string
  options: readonly { value: TValue; label: string }[]
  controlAttrs?: { ref?: (element: Element | null) => void; [name: string]: unknown } | undefined
  as?: 'select' | 'div' | undefined
}

defineOptions({ inheritAttrs: false })

const { label, options, controlAttrs = {}, as = 'select' } = defineProps<PatternInputProps<T>>()
const model = defineModel<T | null>({ required: true })
defineSlots<{
  hint?(): unknown
  option?(props: { option: { value: T; label: string }; index: number }): unknown
}>()

const attrs = useAttrs()
const rootAttrs = computed(() => ({ class: attrs['class'], style: attrs['style'] }))
const nativeAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  const { ref: _ref, ...control } = controlAttrs
  return { ...rest, ...control }
})

const own = useTemplateRef<HTMLSelectElement>('own')
let registered: Element | null = null
const setControl = (element: unknown): void => {
  const next = element instanceof Element ? element : null
  if (next === registered) return
  registered = next
  controlAttrs.ref?.(next)
}

const onChange = (event: Event): void => {
  const index = (event.target as HTMLSelectElement).selectedIndex
  model.value = options[index]?.value ?? null
}

defineExpose({ focus: () => own.value?.focus(), ownElement: () => own.value })
</script>

<template>
  <PatternField :label="label" v-bind="rootAttrs" tone="warm">
    <template #default="{ controlId, describedBy }">
      <select
        :id="controlId"
        :ref="setControl"
        v-bind="nativeAttrs"
        :aria-describedby="[describedBy, attrs['aria-describedby']].filter(Boolean).join(' ') || undefined"
        data-testid="pattern-select"
        @change="onChange"
      >
        <option v-for="(option, index) in options" :key="option.value" :selected="option.value === model">
          <slot name="option" :option="option" :index="index">{{ option.label }}</slot>
        </option>
      </select>
      <select ref="own" hidden />
      <PatternTone :as="as === 'div' ? 'div' : 'span'" />
    </template>
    <template v-if="$slots.hint" #hint><slot name="hint" /></template>
  </PatternField>
</template>
