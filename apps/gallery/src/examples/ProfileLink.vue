<script setup lang="ts" vapor>
import { UiIconButton, UiInput, iconClose } from '@your-scope/ui'
import type { UiFormFieldBinding } from '@your-scope/ui/forms'
import { useT } from '../i18n.ts'

/**
 * One row of the profile form's `links` array field. The parent creates the
 * field store (it owns the schema types) and this row only renders it.
 */
const { link, index } = defineProps<{
  /** Binding from `useUiFormField()` for `['links', index]`. */
  link: UiFormFieldBinding<string | undefined>
  index: number
}>()
const emit = defineEmits<{ remove: [] }>()

const t = useT()
// Kept in script: vue-tsc 3.3.14 mis-parses `//` inside a static component attribute (docs/compatibility.md).
const placeholder = 'https://'
</script>

<template>
  <div class="flex items-start gap-2">
    <UiInput
      v-bind="link"
      class="min-w-0 flex-1"
      type="url"
      inputmode="url"
      :placeholder="placeholder"
      hide-label
      :label="t('profile.link', { index: index + 1 })"
    />
    <UiIconButton
      :label="t('profile.link.remove', { index: index + 1 })"
      :icon="iconClose"
      variant="ghost"
      @click="emit('remove')"
    />
  </div>
</template>
