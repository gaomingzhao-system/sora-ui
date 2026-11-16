<script setup lang="ts" vapor>
import { computed } from 'vue'
import { UiBadge, UiProvider, UiTable } from '@your-scope/ui'
import type { UiTableColumn, UiTableRowKey, UiTableSort } from '@your-scope/ui'

export interface Member {
  id: number
  name: string
  role: string
  seats: number
  active: boolean
}

export interface DataState {
  rows: Member[]
  sort: UiTableSort | null
  selected: UiTableRowKey[]
  loading: boolean
  selectable: boolean
  width: string
  caption: string | undefined
  locale: string
}

const { state } = defineProps<{ state: DataState }>()

const columns: UiTableColumn<Member>[] = [
  { key: 'name', header: 'Name', sortable: true, rowHeader: true },
  { key: 'role', header: 'Role', width: '12rem' },
  { key: 'seats', header: 'Seats', align: 'end', sortable: true },
  { key: 'status', header: 'Status', accessor: (row) => (row.active ? 'Active' : 'Invited') },
]

// The table reports the sort; the owner of the data applies it.
const sorted = computed(() => {
  const sort = state.sort
  if (!sort) return state.rows
  const factor = sort.direction === 'ascending' ? 1 : -1
  return state.rows.toSorted((a, b) =>
    sort.key === 'seats' ? (a.seats - b.seats) * factor : a.name.localeCompare(b.name) * factor,
  )
})
</script>

<template>
  <UiProvider :locale="state.locale">
    <div data-testid="table-box" :style="{ inlineSize: state.width }">
      <UiTable
        v-model:sort="state.sort"
        v-model:selected="state.selected"
        data-testid="table"
        row-key="id"
        :caption="state.caption"
        :columns="columns"
        :rows="sorted"
        :loading="state.loading"
        :selectable="state.selectable"
      >
        <template #cell-status="{ value, row }">
          <UiBadge :color="row.active ? 'success' : 'neutral'" data-testid="status-badge">{{
            value
          }}</UiBadge>
        </template>
      </UiTable>
    </div>
  </UiProvider>

  <UiTable
    data-testid="table-plain"
    caption="Hidden caption"
    hide-caption
    striped
    size="sm"
    empty-text="Nothing here yet"
    :row-key="(row: Member) => `m-${row.id}`"
    :columns="columns"
    :rows="[]"
  />

  <UiTable
    data-testid="table-slots"
    :row-key="(row: Member) => row.id"
    :columns="columns"
    :rows="state.rows.slice(0, 1)"
  >
    <template #header="{ column }">
      <em>{{ column.header }}!</em>
    </template>
    <template #cell="{ value, index }">
      <span data-testid="generic-cell">{{ index }}:{{ value }}</span>
    </template>
  </UiTable>

  <UiTable data-testid="table-empty-slot" row-key="id" :columns="columns" :rows="[]" selectable>
    <template #empty>
      <strong data-testid="empty-slot">No members</strong>
    </template>
  </UiTable>
</template>
