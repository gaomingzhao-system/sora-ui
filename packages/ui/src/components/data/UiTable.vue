<script setup lang="ts" vapor generic="Row extends object">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import type { HTMLAttributes } from 'vue'
import { useUiDefaults } from '../../composables/use-ui-config.ts'
import { useUiLocale } from '../../composables/use-ui-locale.ts'
import { iconSort, iconSortAscending, iconSortDescending } from '../../internal/icons.ts'
import { useUiId } from '../../internal/ids.ts'
import type { UiSize } from '../../types/common.ts'
import UiSkeleton from '../feedback/UiSkeleton.vue'
import UiIcon from '../foundation/UiIcon.vue'
import UiCheckbox from '../inputs/UiCheckbox.vue'

export interface UiTableColumn<TRow extends object = Record<string, unknown>> {
  /** Column id; also the row property read by default. */
  key: string
  header: string
  /** Cell value. Defaults to `row[key]`. */
  accessor?: ((row: TRow) => unknown) | undefined
  align?: 'start' | 'center' | 'end' | undefined
  /** Offer sorting on this column (the table reports it; the owner sorts the rows). */
  sortable?: boolean | undefined
  /** CSS width of the column, e.g. `8rem` or `30%`. */
  width?: string | undefined
  /** Cells of this column are row headers (`<th scope="row">`). */
  rowHeader?: boolean | undefined
}

export interface UiTableSort {
  key: string
  direction: 'ascending' | 'descending'
}

export type UiTableRowKey = string | number

export interface UiTableProps<TRow extends object = Record<string, unknown>>
  extends /* @vue-ignore */ HTMLAttributes {
  columns: readonly UiTableColumn<TRow>[]
  rows: readonly TRow[]
  /** Stable identity of a row: a property name or a function. Never the array index. */
  rowKey: (keyof TRow & string) | ((row: TRow) => UiTableRowKey)
  /** Table caption (its accessible name). */
  caption?: string | undefined
  /** Keep the caption for assistive technology but hide it visually. */
  hideCaption?: boolean | undefined
  loading?: boolean | undefined
  /** Text for the empty state. Defaults to the translated "No data to display". */
  emptyText?: string | undefined
  /** Add a checkbox column bound to `v-model:selected`. */
  selectable?: boolean | undefined
  size?: UiSize | undefined
  striped?: boolean | undefined
}

defineOptions({ name: 'UiTable' })

const {
  columns,
  rows,
  rowKey,
  caption,
  hideCaption = false,
  loading = false,
  emptyText,
  selectable = false,
  size,
  striped = false,
} = defineProps<UiTableProps<Row>>()

/** Controlled sort state. The table never reorders `rows` itself. */
const sort = defineModel<UiTableSort | null>('sort', { default: null })
/** Keys of the selected rows. */
const selected = defineModel<UiTableRowKey[]>('selected', { default: () => [] })

defineSlots<
  {
    /** Any cell. `cell-<key>` slots take precedence for their column. */
    cell?(props: { row: Row; column: UiTableColumn<Row>; value: unknown; index: number }): unknown
    /** Header content of any column. */
    header?(props: { column: UiTableColumn<Row> }): unknown
    /** Replaces the empty state. */
    empty?(): unknown
  } & {
    [K in `cell-${string}`]?: (props: {
      row: Row
      column: UiTableColumn<Row>
      value: unknown
      index: number
    }) => unknown
  }
>()

const defaults = useUiDefaults('table')
const resolvedSize = computed(() => size ?? defaults().size)
const { t, formatNumber } = useUiLocale()
const captionId = `${useUiId()}-caption`

function keyOf(row: Row): UiTableRowKey {
  return typeof rowKey === 'function' ? rowKey(row) : (row[rowKey] as UiTableRowKey)
}

function valueOf(row: Row, column: UiTableColumn<Row>): unknown {
  return column.accessor ? column.accessor(row) : (row as Record<string, unknown>)[column.key]
}

function display(value: unknown): string {
  if (value == null) return ''
  return typeof value === 'number' ? formatNumber(value) : String(value)
}

// ------------------------------------------------------------------- sorting
function ariaSort(column: UiTableColumn<Row>): 'ascending' | 'descending' | 'none' | undefined {
  if (!column.sortable) return undefined
  return sort.value?.key === column.key ? sort.value.direction : 'none'
}

// none -> ascending -> descending -> none
function cycleSort(column: UiTableColumn<Row>): void {
  const current = sort.value?.key === column.key ? sort.value.direction : undefined
  if (current === undefined) sort.value = { key: column.key, direction: 'ascending' }
  else if (current === 'ascending') sort.value = { key: column.key, direction: 'descending' }
  else sort.value = null
}

// ----------------------------------------------------------------- selection
const keys = computed(() => rows.map(keyOf))
const selectedSet = computed(() => new Set(selected.value))
const selectedCount = computed(() => keys.value.filter((key) => selectedSet.value.has(key)).length)
const allSelected = computed(() => keys.value.length > 0 && selectedCount.value === keys.value.length)
const someSelected = computed(() => selectedCount.value > 0 && !allSelected.value)

function toggleAll(checked: boolean): void {
  const visible = new Set(keys.value)
  const others = selected.value.filter((key) => !visible.has(key))
  selected.value = checked ? [...others, ...keys.value] : others
}

function toggleRow(key: UiTableRowKey, checked: boolean): void {
  selected.value = checked ? [...selected.value, key] : selected.value.filter((entry) => entry !== key)
}

/** Text that identifies a row to assistive technology in the selection column. */
function rowLabel(row: Row, index: number): string {
  const header = columns.find((column) => column.rowHeader) ?? columns[0]
  const text = header ? display(valueOf(row, header)) : ''
  return text || formatNumber(index + 1)
}

const columnCount = computed(() => columns.length + (selectable ? 1 : 0))

// ---------------------------------------------------- keyboard-scrollable wrap
// Whether the table overflows cannot be known from CSS, so a ResizeObserver
// decides when the wrapper must become a focusable, labelled scroll region.
const wrap = useTemplateRef<HTMLElement>('wrap')
const scrollable = ref(false)
let observer: ResizeObserver | undefined

function measure(): void {
  const element = wrap.value
  if (element) scrollable.value = element.scrollWidth > element.clientWidth + 1
}

onMounted(() => {
  const element = wrap.value
  if (!element) return
  observer = new ResizeObserver(measure)
  observer.observe(element)
  if (element.firstElementChild) observer.observe(element.firstElementChild)
  measure()
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div
    ref="wrap"
    class="vui-table-wrap"
    :role="scrollable ? 'region' : undefined"
    :tabindex="scrollable ? 0 : undefined"
    :aria-labelledby="scrollable && caption ? captionId : undefined"
    :aria-label="scrollable && !caption ? t('table.region') : undefined"
  >
    <!-- A real table: no grid role, because cells are not an interactive grid. -->
    <table
      class="vui-table"
      :data-size="resolvedSize"
      :data-striped="striped ? '' : undefined"
      :aria-busy="loading ? 'true' : undefined"
    >
      <caption
        v-if="caption"
        :id="captionId"
        class="vui-table__caption"
        :data-visually-hidden="hideCaption ? '' : undefined"
      >
        {{ caption }}
      </caption>
      <thead>
        <tr>
          <th v-if="selectable" scope="col" class="vui-table__cell vui-table__cell--select">
            <UiCheckbox
              :model-value="allSelected"
              :indeterminate="someSelected"
              :disabled="rows.length === 0"
              :aria-label="t('table.selectAll')"
              @update:model-value="toggleAll"
            />
          </th>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            class="vui-table__cell vui-table__cell--head"
            :data-align="column.align ?? 'start'"
            :style="{ inlineSize: column.width }"
            :aria-sort="ariaSort(column)"
          >
            <button
              v-if="column.sortable"
              type="button"
              class="vui-table__sort"
              :title="t('table.sort', { column: column.header })"
              @click="cycleSort(column)"
            >
              <span><slot name="header" :column="column">{{ column.header }}</slot></span>
              <UiIcon
                :icon="
                  ariaSort(column) === 'ascending'
                    ? iconSortAscending
                    : ariaSort(column) === 'descending'
                      ? iconSortDescending
                      : iconSort
                "
                class="vui-table__sort-icon"
              />
            </button>
            <slot v-else name="header" :column="column">{{ column.header }}</slot>
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-if="loading && rows.length === 0">
          <tr v-for="line in 3" :key="line" class="vui-table__row" aria-hidden="true">
            <td v-for="cell in columnCount" :key="cell" class="vui-table__cell"><UiSkeleton /></td>
          </tr>
        </template>
        <tr v-else-if="rows.length === 0" class="vui-table__row">
          <td class="vui-table__cell vui-table__cell--empty" :colspan="columnCount">
            <slot name="empty">{{ emptyText ?? t('table.empty') }}</slot>
          </td>
        </tr>
        <tr
          v-for="(row, index) in rows"
          v-else
          :key="keyOf(row)"
          class="vui-table__row"
          :data-selected="selectedSet.has(keyOf(row)) ? '' : undefined"
        >
          <td v-if="selectable" class="vui-table__cell vui-table__cell--select">
            <UiCheckbox
              :model-value="selectedSet.has(keyOf(row))"
              :aria-label="t('table.selectRow', { row: rowLabel(row, index) })"
              @update:model-value="toggleRow(keyOf(row), $event)"
            />
          </td>
          <component
            :is="column.rowHeader ? 'th' : 'td'"
            v-for="column in columns"
            :key="column.key"
            class="vui-table__cell"
            :scope="column.rowHeader ? 'row' : undefined"
            :data-align="column.align ?? 'start'"
          >
            <slot
              :name="`cell-${column.key}`"
              :row="row"
              :column="column"
              :value="valueOf(row, column)"
              :index="index"
            >
              <slot name="cell" :row="row" :column="column" :value="valueOf(row, column)" :index="index">
                {{ display(valueOf(row, column)) }}
              </slot>
            </slot>
          </component>
        </tr>
      </tbody>
    </table>
    <span v-if="loading" class="vui-sr-only" role="status">{{ t('table.loading') }}</span>
  </div>
</template>
