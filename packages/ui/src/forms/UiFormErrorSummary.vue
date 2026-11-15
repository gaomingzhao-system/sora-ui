<script setup lang="ts" vapor>
import { getDeepErrorEntries } from '@formisch/vue'
import type { FormSchema, FormStore } from '@formisch/vue'
import { computed, inject } from 'vue'
import type { HTMLAttributes } from 'vue'
import UiIcon from '../components/foundation/UiIcon.vue'
import { useUiLocale } from '../composables/use-ui-locale.ts'
import { iconError } from '../internal/icons.ts'
import { useUiId } from '../internal/ids.ts'
import { uiFormKey } from './types.ts'
import type { UiFormErrorEntry } from './types.ts'

export interface UiFormErrorSummaryProps extends /* @vue-ignore */ HTMLAttributes {
  /** Formisch store. Defaults to the store of the surrounding UiForm. */
  // The summary only reads error entries, so any schema is acceptable here.
  // oxlint-disable-next-line typescript/no-explicit-any
  of?: FormStore<any> | undefined
  /** Heading text. Defaults to the translated "There is a problem". */
  title?: string | undefined
  headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined
}

defineOptions({ name: 'UiFormErrorSummary' })

const { of, title, headingLevel = 2 } = defineProps<UiFormErrorSummaryProps>()

defineSlots<{
  /** One entry (label, message and link by default). */
  entry?(props: { entry: UiFormErrorEntry; focus: () => void }): unknown
}>()

const { t } = useUiLocale()
const context = inject(uiFormKey, undefined)
const titleId = `${useUiId()}-title`

const store = computed<FormStore<FormSchema> | undefined>(() => of ?? context?.form())

/** The native control Formisch registered for a path (its `name` is the JSON path). */
function controlFor(path: readonly (string | number)[]): HTMLElement | null {
  const scope: ParentNode = context?.element() ?? document
  return scope.querySelector<HTMLElement>(`[name="${CSS.escape(JSON.stringify(path))}"]`)
}

function labelFor(control: HTMLElement): string | undefined {
  // A group (radios, checkboxes) is named by its legend, a single control by its label.
  const legend = control.closest('fieldset')?.querySelector(':scope > legend')
  const label = legend ?? (control as HTMLInputElement).labels?.[0]
  const text = label?.textContent?.replace(/\s*\*\s*$/, '').trim()
  return text || undefined
}

// `getDeepErrorEntries` (not `form.errors`, which only holds root errors)
// walks every field, so nested and array fields are included.
const entries = computed<UiFormErrorEntry[]>(() => {
  const form = store.value
  if (!form) return []
  return getDeepErrorEntries(form).flatMap((entry) => {
    const path = entry.path as readonly (string | number)[]
    const control = path.length > 0 ? controlFor(path) : null
    return entry.errors.map((message, index) => ({
      key: `${JSON.stringify(path)}:${index}`,
      path,
      label: control ? labelFor(control) : undefined,
      fieldId: control?.id || undefined,
      message,
    }))
  })
})

const hasFormLevelError = computed(() => entries.value.some((entry) => entry.path.length === 0))

function focusField(entry: UiFormErrorEntry): void {
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
    class="vui-alert vui-error-summary"
    data-color="error"
    data-variant="soft"
    :role="hasFormLevelError ? 'alert' : 'group'"
    :aria-labelledby="titleId"
  >
    <span class="vui-alert__icon" aria-hidden="true"><UiIcon :icon="iconError" /></span>
    <div class="vui-alert__content">
      <component :is="`h${headingLevel}`" :id="titleId" class="vui-alert__title">
        {{ title ?? t('form.errorSummary.title') }}
      </component>
      <ul class="vui-error-summary__list">
        <li v-for="entry in entries" :key="entry.key">
          <slot name="entry" :entry="entry" :focus="() => focusField(entry)">
            <a
              v-if="entry.fieldId"
              class="vui-link"
              data-color="error"
              data-underline="always"
              :href="`#${entry.fieldId}`"
              @click.prevent="focusField(entry)"
            >
              <template v-if="entry.label">{{ entry.label }}: </template>{{ entry.message }}
            </a>
            <span v-else>{{ entry.message }}</span>
          </slot>
        </li>
      </ul>
    </div>
  </div>
</template>
