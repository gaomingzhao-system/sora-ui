<script setup lang="ts" vapor>
import { computed, onBeforeUnmount, shallowReactive, watch } from 'vue'
import type { InputHTMLAttributes } from 'vue'
import { useControl } from '../../composables/use-control.ts'
import { useSoraLocale } from '../../composables/use-sora-locale.ts'
import { iconClose, iconFile, iconUpload } from '../../internal/icons.ts'
import type { SoraControlAttrs, SoraSize } from '../../types/common.ts'
import SoraIcon from '../foundation/SoraIcon.vue'
import SoraField from './SoraField.vue'

export interface SoraFileInputProps
  extends /* @vue-ignore */ Omit<
    InputHTMLAttributes,
    'size' | 'type' | 'value' | 'disabled' | 'required' | 'id' | 'multiple' | 'accept'
  > {
  /** The selected `File` objects themselves (not names or fake paths). `null`/`undefined` mean none. */
  modelValue: readonly File[] | null | undefined
  label?: string | undefined
  hint?: string | undefined
  error?: string | readonly string[] | null | undefined
  required?: boolean | undefined
  disabled?: boolean | undefined
  invalid?: boolean | undefined
  size?: SoraSize | undefined
  id?: string | undefined
  hideLabel?: boolean | undefined
  /** `horizontal` puts the label beside the control when the container is wide enough. */
  orientation?: 'vertical' | 'horizontal' | undefined
  multiple?: boolean | undefined
  /** Native `accept` filter, e.g. `image/*,.pdf`. */
  accept?: string | undefined
  /** Text of the picker button. Defaults to the translated "Choose file(s)". */
  buttonLabel?: string | undefined
  /** Show thumbnails for image files (object URLs are revoked automatically). */
  previews?: boolean | undefined
  controlAttrs?: SoraControlAttrs | undefined
}

defineOptions({ name: 'SoraFileInput', inheritAttrs: false })

const {
  modelValue,
  label,
  hint,
  error,
  required = false,
  disabled = false,
  invalid = false,
  size,
  id,
  hideLabel = false,
  orientation = 'vertical',
  multiple = false,
  accept,
  buttonLabel,
  previews = false,
  controlAttrs,
} = defineProps<SoraFileInputProps>()

const emit = defineEmits<{
  'update:modelValue': [value: File[]]
}>()

defineSlots<{ label?(): unknown; hint?(): unknown }>()

const { t, formatNumber } = useSoraLocale()
const control = useControl<HTMLInputElement>(() => controlAttrs)

function onChange(event: Event): void {
  emit('update:modelValue', [...((event.target as HTMLInputElement).files ?? [])])
}

// Model -> native input, so removing one file or clearing from the parent
// also changes what the form would submit.
function writeFiles(files: readonly File[]): void {
  const element = control.element.value
  if (!element) return
  const current = [...(element.files ?? [])]
  if (current.length === files.length && current.every((file, index) => file === files[index])) return
  if (files.length === 0) {
    element.value = ''
    return
  }
  const transfer = new DataTransfer()
  for (const file of files) transfer.items.add(file)
  element.files = transfer.files
}
const files = computed<readonly File[]>(() => modelValue ?? [])
watch(files, writeFiles, { flush: 'post' })

// A native form reset empties the input without firing `change`.
watch(
  () => control.element.value?.form ?? null,
  (form, _previous, onCleanup) => {
    if (!form) return
    const onReset = (): void => emit('update:modelValue', [])
    form.addEventListener('reset', onReset)
    onCleanup(() => form.removeEventListener('reset', onReset))
  },
  { immediate: true, flush: 'post' },
)

// Preview object URLs: created lazily, revoked as soon as their file leaves
// the selection, and all revoked on unmount.
const urls = shallowReactive(new Map<File, string>())
watch(
  [files, () => previews],
  ([selection, enabled]) => {
    const wanted = new Set(enabled ? selection.filter((file) => file.type.startsWith('image/')) : [])
    for (const [file, url] of urls) {
      if (wanted.has(file)) continue
      URL.revokeObjectURL(url)
      urls.delete(file)
    }
    for (const file of wanted) {
      if (!urls.has(file)) urls.set(file, URL.createObjectURL(file))
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  for (const url of urls.values()) URL.revokeObjectURL(url)
  urls.clear()
})

const summary = computed(() => {
  if (files.value.length === 0) return t('file.none')
  if (files.value.length === 1) return files.value[0]?.name ?? ''
  return t('file.count', { count: formatNumber(files.value.length) })
})

function formatSize(bytes: number): string {
  if (bytes < 1024) return formatNumber(bytes, { style: 'unit', unit: 'byte', unitDisplay: 'narrow' })
  if (bytes < 1024 * 1024) {
    return formatNumber(bytes / 1024, { style: 'unit', unit: 'kilobyte', maximumFractionDigits: 1 })
  }
  return formatNumber(bytes / (1024 * 1024), { style: 'unit', unit: 'megabyte', maximumFractionDigits: 1 })
}

function remove(index: number): void {
  emit(
    'update:modelValue',
    files.value.filter((_file, position) => position !== index),
  )
  control.element.value?.focus()
}

function clear(): void {
  emit('update:modelValue', [])
}

defineExpose({
  focus: (options?: FocusOptions) => control.element.value?.focus(options),
  /** Remove every selected file. */
  clear,
  get element() {
    return control.element.value
  },
})
</script>

<template>
  <SoraField
    v-bind="control.rootAttrs.value"
    :id="id"
    :label="label"
    :hint="hint"
    :error="error"
    :required="required"
    :disabled="disabled"
    :invalid="invalid"
    :size="size"
    :hide-label="hideLabel"
    :orientation="orientation"
  >
    <template #default="field">
      <div
        class="sora-file"
        :data-invalid="field.invalid ? '' : undefined"
        :data-disabled="disabled ? '' : undefined"
      >
        <div class="sora-file__picker">
          <!-- The real file input covers the picker: native semantics, keyboard and drop all stay intact. -->
          <input
            v-bind="control.nativeAttrs.value"
            :id="field.id"
            :ref="control.setElement"
            class="sora-file__input"
            type="file"
            :multiple="multiple"
            :accept="accept"
            :disabled="disabled"
            :required="required"
            :aria-invalid="field.invalid ? 'true' : undefined"
            :aria-describedby="control.describedBy(field.describedBy)"
            @change="onChange"
          />
          <span class="sora-file__button" aria-hidden="true">
            <SoraIcon :icon="iconUpload" />
            {{ buttonLabel ?? (multiple ? t('file.chooseMultiple') : t('file.choose')) }}
          </span>
          <span class="sora-file__summary" aria-hidden="true">{{ summary }}</span>
        </div>
        <ul v-if="files.length > 0" class="sora-file__list" :aria-label="t('file.list')">
          <li
            v-for="(file, index) in files"
            :key="`${file.name}:${file.size}:${file.lastModified}:${index}`"
            class="sora-file__item"
          >
            <img v-if="urls.get(file)" class="sora-file__preview" :src="urls.get(file)" alt="" />
            <SoraIcon v-else :icon="iconFile" class="sora-file__glyph" />
            <span class="sora-file__name">{{ file.name }}</span>
            <span class="sora-file__size">{{ formatSize(file.size) }}</span>
            <button
              type="button"
              class="sora-input__button"
              :disabled="disabled"
              :aria-label="t('file.remove', { name: file.name })"
              @click="remove(index)"
            >
              <SoraIcon :icon="iconClose" />
            </button>
          </li>
        </ul>
      </div>
    </template>
    <template v-if="$slots.label" #label><slot name="label" /></template>
    <template v-if="$slots.hint" #hint><slot name="hint" /></template>
  </SoraField>
</template>
