<script setup lang="ts" vapor>
// 3. Typed defineModel (default and named), 4. useTemplateRef + defineExpose,
// 5. native attributes / event forwarding on the meaningful native element.
import { useAttrs, useTemplateRef } from 'vue'
import type { InputHTMLAttributes } from 'vue'

// Typed passthrough: the native input's attributes are part of the public
// props type, but (`@vue-ignore`) not runtime props, so they stay in `attrs`.
export interface CompatModelProps extends /* @vue-ignore */ Omit<InputHTMLAttributes, 'value'> {}

defineOptions({ inheritAttrs: false })
defineProps<CompatModelProps>()

const model = defineModel<string>({ required: true })
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ commit: [value: string] }>()
const attrs = useAttrs()
const input = useTemplateRef<HTMLInputElement>('input')

defineExpose({
  focus: () => input.value?.focus(),
  element: () => input.value,
})
</script>

<template>
  <div data-testid="model-root" :data-open="open">
    <input
      ref="input"
      v-bind="attrs"
      data-testid="model-input"
      :value="model"
      @input="model = ($event.target as HTMLInputElement).value"
      @keydown.enter="emit('commit', model)"
    />
    <button type="button" data-testid="model-toggle" @click="open = !open">toggle</button>
  </div>
</template>
