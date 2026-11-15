<script setup lang="ts" vapor>
import { computed, ref } from 'vue'
import { UiAvatar, UiBadge, UiButton, UiTable } from '@your-scope/ui'
import type { UiTableColumn, UiTableRowKey, UiTableSort } from '@your-scope/ui'
import DemoSection from '../components/DemoSection.vue'
import { useT } from '../i18n.ts'

interface Member {
  id: number
  name: string
  role: 'owner' | 'editor' | 'viewer'
  seats: number
}

const t = useT()
const members: Member[] = [
  { id: 1, name: 'Ada Lovelace', role: 'owner', seats: 12 },
  { id: 2, name: 'Grace Hopper', role: 'editor', seats: 4 },
  { id: 3, name: '山田 太郎', role: 'viewer', seats: 1 },
  { id: 4, name: 'ليلى حسن', role: 'editor', seats: 7 },
]

const sort = ref<UiTableSort | null>({ key: 'name', direction: 'ascending' })
const selected = ref<UiTableRowKey[]>([2])
const loading = ref(false)
const empty = ref(false)

const columns = computed<UiTableColumn<Member>[]>(() => [
  { key: 'name', header: t('demo.table.name'), sortable: true, rowHeader: true },
  { key: 'role', header: t('demo.table.role'), sortable: true },
  { key: 'seats', header: t('demo.table.seats'), align: 'end', sortable: true, width: '6rem' },
])

// Sorting is controlled: the table reports the request, the owner orders the rows.
const rows = computed(() => {
  if (empty.value) return []
  const current = sort.value
  if (!current) return members
  const direction = current.direction === 'ascending' ? 1 : -1
  return members.toSorted((a, b) => {
    const left = a[current.key as keyof Member]
    const right = b[current.key as keyof Member]
    return (
      (typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left).localeCompare(String(right))) * direction
    )
  })
})

function reload(): void {
  loading.value = true
  setTimeout(() => (loading.value = false), 1200)
}
</script>

<template>
  <DemoSection name="UiTable">
    <div class="grid gap-3">
      <div class="flex flex-wrap gap-2">
        <UiButton size="sm" variant="outline" color="neutral" @click="reload">{{
          t('demo.loading')
        }}</UiButton>
        <UiButton size="sm" variant="outline" color="neutral" :aria-pressed="empty" @click="empty = !empty">{{
          t('table.empty')
        }}</UiButton>
      </div>
      <UiTable
        v-model:sort="sort"
        v-model:selected="selected"
        :columns="columns"
        :rows="rows"
        row-key="id"
        :caption="t('demo.table.caption')"
        :loading="loading"
        selectable
        data-testid="demo-table"
      >
        <template #cell-name="{ row }">
          <span class="flex items-center gap-2"><UiAvatar :name="row.name" size="sm" />{{ row.name }}</span>
        </template>
        <template #cell-role="{ row }">
          <UiBadge :color="row.role === 'owner' ? 'secondary' : 'neutral'">{{
            t(`settings.role.${row.role}`)
          }}</UiBadge>
        </template>
      </UiTable>
      <p class="text-vui-sm text-vui-muted" data-testid="table-selected">
        {{ t('demo.selected', { value: selected.join(', ') || '—' }) }}
      </p>
    </div>
  </DemoSection>
</template>
