<script setup lang="ts" vapor>
import { useForm } from '@formisch/vue'
import * as v from 'valibot'
import { SoraIconButton, SoraInput, iconClose } from '@your-scope/ui'
import { useSoraFormField } from '@your-scope/ui/forms'

/**
 * One row of the `tags` array field. Each row is its own component (keyed by
 * the Formisch item id), so its field registers and cleans up with the row.
 */
const tagsSchema = v.object({ tags: v.array(v.string()) })
type TagsForm = ReturnType<typeof useForm<typeof tagsSchema>>

const { form, index } = defineProps<{
  /** Any form whose schema has a `tags: string[]` field. */
  form: unknown
  index: number
}>()
defineEmits<{ remove: [] }>()

// A getter path: the row follows its item when earlier rows are removed.
const tag = useSoraFormField(form as TagsForm, () => ({ path: ['tags', index] as const }))
</script>

<template>
  <div data-testid="tag-row">
    <SoraInput v-bind="tag.props" :label="`Tag ${index + 1}`" data-testid="tag" />
    <SoraIconButton
      :label="`Remove tag ${index + 1}`"
      :icon="iconClose"
      data-testid="tag-remove"
      @click="$emit('remove')"
    />
  </div>
</template>
