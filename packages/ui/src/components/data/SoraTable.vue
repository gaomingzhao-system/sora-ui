<script setup lang="ts" vapor generic="Row extends object">
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, type HTMLAttributes } from 'vue'
import { useSoraDefaults } from '../../composables/use-sora-config.ts'
import { useSoraLocale } from '../../composables/use-sora-locale.ts'
import { iconSort, iconSortAscending, iconSortDescending } from '../../internal/icons.ts'
import { useSoraId } from '../../internal/ids.ts'
import type { SoraSize } from '../../types/common.ts'
import SoraSkeleton from '../feedback/SoraSkeleton.vue'
import SoraIcon from '../foundation/SoraIcon.vue'
import SoraCheckbox from '../inputs/SoraCheckbox.vue'

export interface SoraTableColumn<TRow extends object = Record<string, unknown>> {
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

export interface SoraTableSort {
  key: string
  direction: 'ascending' | 'descending'
}

export type SoraTableRowKey = string | number

export interface SoraTableProps<TRow extends object = Record<string, unknown>>
  extends /* @vue-ignore */ HTMLAttributes {
  columns: readonly SoraTableColumn<TRow>[]
  rows: readonly TRow[]
  /** Stable identity of a row: a property name or a function. Never the array index. */
  rowKey: (keyof TRow & string) | ((row: TRow) => SoraTableRowKey)
  /** Table caption (its accessible name). */
  caption?: string | undefined
  /** Keep the caption for assistive technology but hide it visually. */
  hideCaption?: boolean | undefined
  loading?: boolean | undefined
  /** Text for the empty state. Defaults to the translated "No data to display". */
  emptyText?: string | undefined
  /** Add a checkbox column bound to `v-model:selected`. */
  selectable?: boolean | undefined
  size?: SoraSize | undefined
  striped?: boolean | undefined
}

defineOptions({ name: 'SoraTable' })

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
} = defineProps<SoraTableProps<Row>>()

/** Controlled sort state. The table never reorders `rows` itself. */
const sort = defineModel<SoraTableSort | null>('sort', { default: null })
/** Keys of the selected rows. */
const selected = defineModel<SoraTableRowKey[]>('selected', { default: () => [] })

defineSlots<
  {
    /** Any cell. `cell-<key>` slots take precedence for their column. */
    cell?(props: { row: Row; column: SoraTableColumn<Row>; value: unknown; index: number }): unknown
    /** Header content of any column. */
    header?(props: { column: SoraTableColumn<Row> }): unknown
    /** Replaces the empty state. */
    empty?(): unknown
  } & {
    [K in `cell-${string}`]?: (props: {
      row: Row
      column: SoraTableColumn<Row>
      value: unknown
      index: number
    }) => unknown
  }
>()

const defaults = useSoraDefaults('table')
const resolvedSize = computed(() => size ?? defaults().size)
const { t, formatNumber } = useSoraLocale()
const captionId = `${useSoraId()}-caption`

const keyOf = (row: Row): SoraTableRowKey =>
  typeof rowKey === 'function' ? rowKey(row) : (row[rowKey] as SoraTableRowKey)

const valueOf = (row: Row, column: SoraTableColumn<Row>): unknown =>
  column.accessor ? column.accessor(row) : (row as Record<string, unknown>)[column.key]

const display = (value: unknown): string => {
  if (value == null) return ''
  return typeof value === 'number' ? formatNumber(value) : String(value)
}

// ------------------------------------------------------------------- sorting
const ariaSort = (column: SoraTableColumn<Row>): 'ascending' | 'descending' | 'none' | undefined => {
  if (!column.sortable) return undefined
  return sort.value?.key === column.key ? sort.value.direction : 'none'
}

// none -> ascending -> descending -> none
const cycleSort = (column: SoraTableColumn<Row>): void => {
  const current = sort.value?.key === column.key ? sort.value.direction : undefined
  if (current === undefined) sort.value = { key: column.key, direction: 'ascending' }
  else if (current === 'ascending') sort.value = { key: column.key, direction: 'descending' }
  else sort.value = null
}

// ----------------------------------------------------------------- selection
// Row identities are computed once per change of `rows`; the template reads them by index.
const keys = computed(() => rows.map(keyOf))
const keySet = computed(() => new Set(keys.value))
const selectedSet = computed(() => new Set(selected.value))
const selectedCount = computed(() => keySet.value.intersection(selectedSet.value).size)
const allSelected = computed(() => keySet.value.size > 0 && selectedCount.value === keySet.value.size)
const someSelected = computed(() => selectedCount.value > 0 && !allSelected.value)

const toggleAll = (checked: boolean): void => {
  // Keys selected elsewhere (other pages, filtered-out rows) are kept, in their order.
  const others = [...selectedSet.value.difference(keySet.value)]
  selected.value = checked ? [...others, ...keys.value] : others
}

const toggleRow = (key: SoraTableRowKey, checked: boolean): void => {
  selected.value = checked ? [...selected.value, key] : selected.value.filter((entry) => entry !== key)
}

/** Text that identifies a row to assistive technology in the selection column. */
const rowLabel = (row: Row, index: number): string => {
  const header = columns.find((column) => column.rowHeader) ?? columns[0]
  const text = header ? display(valueOf(row, header)) : ''
  return text || formatNumber(index + 1)
}

const columnCount = computed(() => columns.length + (selectable ? 1 : 0))

// ---------------------------------------------------- keyboard-scrollable wrap
// Whether the table overflows cannot be known from CSS, so a ResizeObserver
// decides when the wrapper must become a focusable, labelled scroll region.
const wrap = useTemplateRef<HTMLElement>('wrap')
const scrollable = shallowRef(false)
let observer: ResizeObserver | undefined

const measure = (): void => {
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
    class="sora-table-wrap"
    :role="scrollable ? 'region' : undefined"
    :tabindex="scrollable ? 0 : undefined"
    :aria-labelledby="scrollable && caption ? captionId : undefined"
    :aria-label="scrollable && !caption ? t('table.region') : undefined"
  >
    <!-- A real table: no grid role, because cells are not an interactive grid. -->
    <table
      class="sora-table"
      :data-size="resolvedSize"
      :data-striped="striped ? '' : undefined"
      :aria-busy="loading ? 'true' : undefined"
    >
      <caption
        v-if="caption"
        :id="captionId"
        class="sora-table__caption"
        :data-visually-hidden="hideCaption ? '' : undefined"
      >
        {{ caption }}
      </caption>
      <thead>
        <tr>
          <th v-if="selectable" scope="col" class="sora-table__cell sora-table__cell--select">
            <SoraCheckbox
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
            class="sora-table__cell sora-table__cell--head"
            :data-align="column.align ?? 'start'"
            :style="{ inlineSize: column.width }"
            :aria-sort="ariaSort(column)"
          >
            <button
              v-if="column.sortable"
              type="button"
              class="sora-table__sort"
              :title="t('table.sort', { column: column.header })"
              @click="cycleSort(column)"
            >
              <span><slot name="header" :column="column">{{ column.header }}</slot></span>
              <SoraIcon
                :icon="
                  ariaSort(column) === 'ascending'
                    ? iconSortAscending
                    : ariaSort(column) === 'descending'
                      ? iconSortDescending
                      : iconSort
                "
                class="sora-table__sort-icon"
              />
            </button>
            <slot v-else name="header" :column="column">{{ column.header }}</slot>
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-if="loading && rows.length === 0">
          <tr v-for="line in 3" :key="line" class="sora-table__row" aria-hidden="true">
            <td v-for="cell in columnCount" :key="cell" class="sora-table__cell"><SoraSkeleton /></td>
          </tr>
        </template>
        <tr v-else-if="rows.length === 0" class="sora-table__row">
          <td class="sora-table__cell sora-table__cell--empty" :colspan="columnCount">
            <slot name="empty">{{ emptyText ?? t('table.empty') }}</slot>
          </td>
        </tr>
        <tr
          v-for="(row, index) in rows"
          v-else
          :key="keys[index] ?? index"
          class="sora-table__row"
          :data-selected="selectedSet.has(keys[index] ?? index) ? '' : undefined"
        >
          <td v-if="selectable" class="sora-table__cell sora-table__cell--select">
            <SoraCheckbox
              :model-value="selectedSet.has(keys[index] ?? index)"
              :aria-label="t('table.selectRow', { row: rowLabel(row, index) })"
              @update:model-value="toggleRow(keys[index] ?? index, $event)"
            />
          </td>
          <component
            :is="column.rowHeader ? 'th' : 'td'"
            v-for="column in columns"
            :key="column.key"
            class="sora-table__cell"
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
    <span v-if="loading" class="sora-sr-only" role="status">{{ t('table.loading') }}</span>
  </div>
</template>
