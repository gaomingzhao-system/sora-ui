<script setup lang="ts" vapor>
import { useForm } from '@formisch/vue'
import * as v from 'valibot'
import { useUiFormField } from '@your-scope/ui/forms'
import ProfileLink from './ProfileLink.vue'

/**
 * Owns the Formisch field of one `links` item. Each row is its own component
 * (keyed by the item id), so `useField()` registers and cleans up per row
 * when items are inserted or removed.
 */
const linksSchema = v.object({ links: v.array(v.string()) })
type LinksForm = ReturnType<typeof useForm<typeof linksSchema>>

const { form, index } = defineProps<{
  /** Any form whose schema has a `links: string[]` field. */
  form: unknown
  index: number
}>()
defineEmits<{ remove: [] }>()

// The path is a getter, so the row follows its item when earlier rows are removed.
const link = useUiFormField(form as LinksForm, () => ({ path: ['links', index] as const }))
</script>

<template>
  <ProfileLink :link="link.props" :index="index" @remove="$emit('remove')" />
</template>
