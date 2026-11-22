<script setup lang="ts" vapor>
import { getDeepErrorEntries, type FormSchema, type FormStore } from '@formisch/vue'
import { computed, inject, type HTMLAttributes } from 'vue'
import SoraIcon from '../components/foundation/SoraIcon.vue'
import { useSoraLocale } from '../composables/use-sora-locale.ts'
import { iconError } from '../internal/icons.ts'
import { useSoraId } from '../internal/ids.ts'
import { steadyWhilePressed } from './press.ts'
import { soraFormKey, type SoraFormErrorEntry } from './types.ts'

export interface SoraFormErrorSummaryProps extends /* @vue-ignore */ HTMLAttributes {
  /** Formisch store. Defaults to the store of the surrounding SoraForm. */
  // The summary only reads error entries, so any schema is acceptable here.
  // oxlint-disable-next-line typescript/no-explicit-any
  of?: FormStore<any> | undefined
  /** Heading text. Defaults to the translated "There is a problem". */
  title?: string | undefined
  headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined
  /**
   * When the summary appears. `submitted` (default): after a submission
   * attempt, like the fields bound with `useSoraFormField()`, because Formisch
   * validates every field as soon as one of them is left. `always`: whenever
   * the store holds an error.
   */
  reveal?: 'submitted' | 'always' | undefined
  /**
   * Messages listed per field: `first` (default, matching what
   * `useSoraFormField()` shows at the field) or `all`.
   */
  errors?: 'first' | 'all' | undefined
}

// The root only exists while there are errors, so attributes are bound explicitly.
defineOptions({ name: 'SoraFormErrorSummary', inheritAttrs: false })

const {
  of,
  title,
  headingLevel = 2,
  reveal = 'submitted',
  errors = 'first',
} = defineProps<SoraFormErrorSummaryProps>()

defineSlots<{
  /** One entry (label, message and link by default). */
  entry?(props: { entry: SoraFormErrorEntry; focus: () => void }): unknown
}>()

const { t } = useSoraLocale()
const context = inject(soraFormKey, undefined)
const titleId = `${useSoraId()}-title`

const store = computed<FormStore<FormSchema> | undefined>(() => of ?? context?.form())

/** The native controls Formisch registered for a path (their `name` is the JSON path). */
const controlsFor = (path: readonly (string | number)[]): HTMLElement[] => {
  const scope: ParentNode = context?.element() ?? document
  return [...scope.querySelectorAll<HTMLElement>(`[name="${CSS.escape(JSON.stringify(path))}"]`)]
}

const labelFor = (controls: readonly HTMLElement[]): string | undefined => {
  const control = controls[0] as HTMLInputElement | undefined
  if (!control) return undefined
  // Radios, and checkboxes that share one name, are options of a group: the
  // field is named by the group's legend. Any other control is named by its
  // own label, also when it happens to sit inside a fieldset.
  const isGroup = control.type === 'radio' || (control.type === 'checkbox' && controls.length > 1)
  const legend = isGroup ? control.closest('fieldset')?.querySelector(':scope > legend') : null
  const text = (legend ?? control.labels?.[0])?.textContent?.replace(/\s*\*\s*$/, '').trim()
  return text || control.getAttribute('aria-label') || undefined
}

// The list is above the fields: a line that appears or disappears while a
// button is pressed would move that button, so changes wait for the release.
const steady = steadyWhilePressed<SoraFormErrorEntry[]>(
  (previous, next) =>
    previous.length === next.length &&
    previous.every((entry, index) => {
      const other = next[index]
      return (
        other !== undefined &&
        entry.key === other.key &&
        entry.message === other.message &&
        entry.label === other.label &&
        entry.fieldId === other.fieldId
      )
    }),
)

// `getDeepErrorEntries` (not `form.errors`, which only holds root errors)
// walks every field, so nested and array fields are included.
const entries = computed<SoraFormErrorEntry[]>(() => steady(readEntries()))

const readEntries = (): SoraFormErrorEntry[] => {
  const form = store.value
  if (!form || (reveal === 'submitted' && !form.isSubmitted)) return []
  return getDeepErrorEntries(form).flatMap((entry) => {
    const path = entry.path as readonly (string | number)[]
    const controls = path.length > 0 ? controlsFor(path) : []
    // A field's messages are the failed steps of one pipe; form-level errors are separate statements.
    const shown = errors === 'all' || path.length === 0 ? entry.errors : entry.errors.slice(0, 1)
    return shown.map((message, index) => ({
      key: `${JSON.stringify(path)}:${index}`,
      path,
      label: labelFor(controls),
      fieldId: controls[0]?.id || undefined,
      message,
    }))
  })
}

const hasFormLevelError = computed(() => entries.value.some((entry) => entry.path.length === 0))

const focusField = (entry: SoraFormErrorEntry): void => {
  if (entry.fieldId) document.getElementById(entry.fieldId)?.focus()
}
</script>

<template>
  <!--
    After a failed submission focus is already on the first invalid field
    (which announces its own error), so the summary is a labelled group. It is
    an alert only for form-level errors, which no field would announce.
  -->
  <div
    v-if="entries.length > 0"
    v-bind="$attrs"
    class="sora-alert sora-error-summary"
    data-color="error"
    data-variant="soft"
    :role="hasFormLevelError ? 'alert' : 'group'"
    :aria-labelledby="titleId"
  >
    <span class="sora-alert__icon" aria-hidden="true"><SoraIcon :icon="iconError" /></span>
    <div class="sora-alert__content">
      <component :is="`h${headingLevel}`" :id="titleId" class="sora-alert__title">
        {{ title ?? t('form.errorSummary.title') }}
      </component>
      <ul class="sora-error-summary__list">
        <li v-for="entry in entries" :key="entry.key">
          <slot name="entry" :entry="entry" :focus="() => focusField(entry)">
            <a
              v-if="entry.fieldId"
              class="sora-link"
              data-color="error"
              data-underline="always"
              :href="`#${entry.fieldId}`"
              @click.prevent="focusField(entry)"
            >
              <template v-if="entry.label">{{ entry.label }}: </template>{{ entry.message }}
            </a>
            <span v-else><template v-if="entry.label">{{ entry.label }}: </template>{{ entry.message }}</span>
          </slot>
        </li>
      </ul>
    </div>
  </div>
</template>
