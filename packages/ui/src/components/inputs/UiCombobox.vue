<script setup lang="ts" vapor generic="T extends string | number">
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, useTemplateRef, watch } from 'vue'
import type { InputHTMLAttributes } from 'vue'
import { useControl } from '../../composables/use-control.ts'
import { usePopover } from '../../composables/use-overlay.ts'
import { useUiLocale } from '../../composables/use-ui-locale.ts'
import { createMatcher, moveIndex } from '../../internal/collections.ts'
import { iconCheck, iconChevronDown, iconClose } from '../../internal/icons.ts'
import { anchorName, useUiId } from '../../internal/ids.ts'
import type { UiControlAttrs, UiOption, UiSize } from '../../types/common.ts'
import UiIcon from '../foundation/UiIcon.vue'
import UiSpinner from '../feedback/UiSpinner.vue'
import UiField from './UiField.vue'

export interface UiComboboxProps<TValue extends string | number = string>
  extends /* @vue-ignore */ Omit<
    InputHTMLAttributes,
    'size' | 'type' | 'value' | 'disabled' | 'required' | 'id' | 'role' | 'placeholder' | 'onSelect'
  > {
  /** The selected option's value, or `null`/`undefined`. Free text is never a value. */
  modelValue: TValue | null | undefined
  /** Options to filter locally. Ignored while `search` is provided. */
  options?: readonly UiOption<TValue>[] | undefined
  /**
   * Asynchronous source. Called (debounced) with the typed text and an
   * `AbortSignal` that fires when the request is superseded. Results that
   * arrive out of order are discarded.
   */
  search?: ((query: string, signal: AbortSignal) => Promise<readonly UiOption<TValue>[]>) | undefined
  label?: string | undefined
  hint?: string | undefined
  error?: string | readonly string[] | null | undefined
  required?: boolean | undefined
  disabled?: boolean | undefined
  invalid?: boolean | undefined
  size?: UiSize | undefined
  id?: string | undefined
  hideLabel?: boolean | undefined
  /** `horizontal` puts the label beside the control when the container is wide enough. */
  orientation?: 'vertical' | 'horizontal' | undefined
  placeholder?: string | undefined
  /** Show a button that clears the selection. */
  clearable?: boolean | undefined
  /** Custom local filter. Default: case- and accent-insensitive "contains" on the label. */
  filter?: ((option: UiOption<TValue>, query: string) => boolean) | undefined
  /** Text for a selected value that is not among the current options (async sources). */
  displayValue?: ((value: TValue) => string) | undefined
  /** Milliseconds to wait after typing before calling `search`. */
  debounce?: number | undefined
  controlAttrs?: UiControlAttrs | undefined
}

defineOptions({ name: 'UiCombobox', inheritAttrs: false })

const {
  modelValue,
  options = [],
  search,
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
  placeholder,
  clearable = true,
  filter,
  displayValue,
  debounce = 200,
  controlAttrs,
} = defineProps<UiComboboxProps<T>>()

const emit = defineEmits<{
  /** The value of the chosen option, or `null` when cleared. */
  'update:modelValue': [value: T | null]
  /** An option was chosen (`null` when cleared). */
  select: [option: UiOption<T> | null]
}>()

defineSlots<{
  label?(): unknown
  hint?(): unknown
  /** Content of one option. */
  option?(props: { option: UiOption<T>; active: boolean; selected: boolean }): unknown
  /** Shown when nothing matches. */
  empty?(props: { query: string }): unknown
}>()

const { t, locale, formatNumber } = useUiLocale()
const control = useControl<HTMLInputElement>(() => controlAttrs)
const baseId = useUiId()
const listId = `${baseId}-listbox`
const anchor = anchorName(`${baseId}-anchor`)
const optionId = (index: number): string => `${baseId}-option-${index}`

const open = ref(false)
const text = ref('')
/** True once the user has typed since the popup opened: only then is the list filtered. */
const typed = ref(false)
const activeIndex = ref(-1)
const loading = ref(false)
const failed = ref(false)
const results = shallowRef<readonly UiOption<T>[]>([])
/** Last chosen option, kept so its label survives when async results change. */
const chosen = shallowRef<UiOption<T> | null>(null)

const popup = useTemplateRef<HTMLElement>('popup')
const popover = usePopover({ element: () => popup.value, open })

const matcher = computed(() => createMatcher(locale.value))
const visible = computed<readonly UiOption<T>[]>(() => {
  if (search) return results.value
  if (!typed.value || text.value.trim() === '') return options
  const matches = matcher.value
  return options.filter((option) => (filter ? filter(option, text.value) : matches(option.label, text.value)))
})

function labelOf(value: T | null | undefined): string {
  if (value == null) return ''
  const known =
    (chosen.value?.value === value ? chosen.value : undefined) ??
    options.find((option) => option.value === value) ??
    results.value.find((option) => option.value === value)
  return known?.label ?? displayValue?.(value) ?? String(value)
}

// The model is the source of truth for the text whenever the user is not editing.
watch(
  () => modelValue,
  (value) => {
    if (!open.value || !typed.value) text.value = labelOf(value)
  },
  { immediate: true },
)

// ---------------------------------------------------------------- async source
let controller: AbortController | undefined
let requestId = 0
let debounceTimer: ReturnType<typeof setTimeout> | undefined

function cancelSearch(): void {
  if (debounceTimer !== undefined) clearTimeout(debounceTimer)
  debounceTimer = undefined
  controller?.abort()
  controller = undefined
}

async function runSearch(query: string): Promise<void> {
  if (!search) return
  controller?.abort()
  controller = new AbortController()
  const { signal } = controller
  const current = ++requestId
  loading.value = true
  failed.value = false
  try {
    const found = await search(query, signal)
    // A newer request (or an abort) makes this response stale: drop it.
    if (current !== requestId || signal.aborted) return
    results.value = found
    activeIndex.value = firstEnabled(found)
  } catch {
    if (current !== requestId || signal.aborted) return
    results.value = []
    failed.value = true
  } finally {
    if (current === requestId) loading.value = false
  }
}

function scheduleSearch(query: string, immediate = false): void {
  if (!search) return
  if (debounceTimer !== undefined) clearTimeout(debounceTimer)
  if (immediate || debounce <= 0) void runSearch(query)
  else debounceTimer = setTimeout(() => void runSearch(query), debounce)
}

onBeforeUnmount(cancelSearch)

// -------------------------------------------------------------- popup and keys
function firstEnabled(list: readonly UiOption<T>[]): number {
  return list.findIndex((option) => !option.disabled)
}

function isDisabledAt(index: number): boolean {
  return visible.value[index]?.disabled === true
}

function show(active: 'selected' | 'first' | 'last' | 'none' = 'selected'): void {
  if (disabled || open.value) return
  typed.value = false
  open.value = true
  if (search) scheduleSearch('', true)
  const list = visible.value
  if (active === 'none') activeIndex.value = -1
  else if (active === 'last') activeIndex.value = moveIndex(list.length, -1, 'last', isDisabledAt)
  else {
    const selected = list.findIndex((option) => option.value === modelValue)
    activeIndex.value = active === 'selected' && selected >= 0 ? selected : firstEnabled(list)
  }
}

function hide(): void {
  if (!open.value) return
  open.value = false
  activeIndex.value = -1
  typed.value = false
  cancelSearch()
  loading.value = false
  // Only an option can be a value: put the selected label back.
  text.value = labelOf(modelValue)
}

function choose(option: UiOption<T>): void {
  if (option.disabled) return
  chosen.value = option
  emit('update:modelValue', option.value)
  text.value = option.label
  emit('select', option)
  hide()
}

function clear(): void {
  chosen.value = null
  emit('update:modelValue', null)
  text.value = ''
  emit('select', null)
  control.element.value?.focus()
}

function onInput(event: Event): void {
  text.value = (event.target as HTMLInputElement).value
  typed.value = true
  if (!open.value) {
    open.value = true
  }
  if (search) scheduleSearch(text.value)
  else activeIndex.value = firstEnabled(visible.value)
}

function move(intent: 'next' | 'previous' | 'first' | 'last'): void {
  activeIndex.value = moveIndex(visible.value.length, activeIndex.value, intent, isDisabledAt)
}

function onKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (!open.value) show(event.altKey ? 'none' : 'selected')
      else if (!event.altKey) move('next')
      break
    case 'ArrowUp':
      event.preventDefault()
      if (event.altKey) hide()
      else if (!open.value) show('last')
      else move('previous')
      break
    case 'Enter': {
      if (!open.value) break
      // The popup is open: Enter belongs to it, not to form submission.
      event.preventDefault()
      const option = visible.value[activeIndex.value]
      if (option) choose(option)
      else hide()
      break
    }
    case 'Escape':
      if (open.value) {
        // Close only the popup, not a surrounding dialog.
        event.preventDefault()
        event.stopPropagation()
        hide()
      } else if (clearable && modelValue != null) {
        clear()
      }
      break
    case 'Tab':
      hide()
      break
  }
}

function onBlur(): void {
  hide()
}

// Keep the active option in view while navigating with the keyboard.
watch(activeIndex, async (index) => {
  if (index < 0 || !open.value) return
  await nextTick()
  popup.value?.querySelector(`#${CSS.escape(optionId(index))}`)?.scrollIntoView({ block: 'nearest' })
})

// One polite announcement per settled result set.
const announcement = computed(() => {
  if (!open.value) return ''
  if (loading.value) return t('combobox.loading')
  if (failed.value) return t('combobox.error')
  if (visible.value.length === 0) return t('combobox.empty')
  return t('combobox.count', { count: formatNumber(visible.value.length) })
})

defineExpose({
  focus: (focusOptions?: FocusOptions) => control.element.value?.focus(focusOptions),
  /** Clear the selection. */
  clear,
  get element() {
    return control.element.value
  },
})
</script>

<template>
  <UiField
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
        class="vui-input vui-combobox"
        :style="{ 'anchor-name': anchor }"
        :data-invalid="field.invalid ? '' : undefined"
        :data-disabled="disabled ? '' : undefined"
      >
        <input
          v-bind="control.nativeAttrs.value"
          :id="field.id"
          :ref="control.setElement"
          class="vui-input__control"
          type="text"
          role="combobox"
          autocomplete="off"
          autocapitalize="none"
          spellcheck="false"
          aria-autocomplete="list"
          :value="text"
          :placeholder="placeholder"
          :disabled="disabled"
          :required="required"
          :aria-expanded="open ? 'true' : 'false'"
          :aria-controls="listId"
          :aria-activedescendant="open && activeIndex >= 0 ? optionId(activeIndex) : undefined"
          :aria-invalid="field.invalid ? 'true' : undefined"
          :aria-describedby="control.describedBy(field.describedBy)"
          @input="onInput"
          @keydown="onKeydown"
          @blur="onBlur"
        />
        <span class="vui-input__affix">
          <UiSpinner v-if="loading" size="sm" decorative />
          <!-- Pointer conveniences; the keyboard path is the input itself (Escape clears, arrows open). -->
          <button
            v-if="clearable && modelValue != null && !disabled"
            type="button"
            class="vui-input__button"
            tabindex="-1"
            :aria-label="t('combobox.clear')"
            @pointerdown.prevent
            @click="clear"
          >
            <UiIcon :icon="iconClose" />
          </button>
          <button
            type="button"
            class="vui-input__button"
            tabindex="-1"
            :disabled="disabled"
            :aria-label="t('combobox.toggle')"
            @pointerdown.prevent
            @click="open ? hide() : (show(), control.element.value?.focus())"
          >
            <UiIcon :icon="iconChevronDown" />
          </button>
        </span>
      </div>
      <!-- Manual popover: top layer without stealing focus from the input. -->
      <div
        ref="popup"
        class="vui-popover vui-combobox__popup"
        popover="manual"
        :style="{ 'position-anchor': anchor }"
        @toggle="popover.onToggle"
        @pointerdown.prevent
      >
        <ul :id="listId" class="vui-listbox" role="listbox" :aria-labelledby="field.labelId">
          <li
            v-for="(option, index) in visible"
            :id="optionId(index)"
            :key="option.value"
            class="vui-listbox__option"
            role="option"
            :aria-selected="option.value === modelValue ? 'true' : 'false'"
            :aria-disabled="option.disabled ? 'true' : undefined"
            :data-active="index === activeIndex ? '' : undefined"
            @click="choose(option)"
            @pointermove="!option.disabled && (activeIndex = index)"
          >
            <span class="vui-listbox__text">
              <slot
                name="option"
                :option="option"
                :active="index === activeIndex"
                :selected="option.value === modelValue"
              >
                <span>{{ option.label }}</span>
                <span v-if="option.description" class="vui-listbox__description">{{
                  option.description
                }}</span>
              </slot>
            </span>
            <UiIcon v-if="option.value === modelValue" :icon="iconCheck" class="vui-listbox__check" />
          </li>
        </ul>
        <p v-if="loading && visible.length === 0" class="vui-combobox__status">{{ t('combobox.loading') }}</p>
        <p v-else-if="failed" class="vui-combobox__status" data-tone="error">{{ t('combobox.error') }}</p>
        <p v-else-if="visible.length === 0" class="vui-combobox__status">
          <slot name="empty" :query="text">{{ t('combobox.empty') }}</slot>
        </p>
      </div>
      <span class="vui-sr-only" role="status" aria-live="polite">{{ announcement }}</span>
    </template>
    <template v-if="$slots.label" #label><slot name="label" /></template>
    <template v-if="$slots.hint" #hint><slot name="hint" /></template>
  </UiField>
</template>
