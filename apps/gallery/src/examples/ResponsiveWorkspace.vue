<script setup lang="ts" vapor>
/**
 * A small application screen that adapts to its *container*, not the
 * viewport: sidebar and content sit side by side when there is room and
 * stack when there is not, wherever the example is placed.
 */
import { computed, ref } from 'vue'
import {
  UiBadge,
  UiBreadcrumbs,
  UiButton,
  UiCard,
  UiDrawer,
  UiDropdownMenu,
  UiEmptyState,
  UiIcon,
  UiInput,
  UiPagination,
  UiProgress,
  UiSelect,
  UiTable,
  iconMore,
  iconPlus,
  iconSearch,
  useToast,
} from '@your-scope/ui'
import type { UiColor, UiMenuItem, UiTableColumn, UiTableSort } from '@your-scope/ui'
import { useT } from '../i18n.ts'

type Status = 'active' | 'paused' | 'archived'
interface Project {
  id: number
  name: string
  owner: string
  status: Status
  updated: string
  progress: number
}

const t = useT()
const toast = useToast()

const projects = ref<Project[]>([
  {
    id: 1,
    name: 'Design system',
    owner: 'Ada Lovelace',
    status: 'active',
    updated: '2026-11-12',
    progress: 0.82,
  },
  {
    id: 2,
    name: 'Onboarding flow',
    owner: 'Grace Hopper',
    status: 'active',
    updated: '2026-11-10',
    progress: 0.45,
  },
  {
    id: 3,
    name: 'Billing migration',
    owner: '山田 太郎',
    status: 'paused',
    updated: '2026-10-28',
    progress: 0.3,
  },
  { id: 4, name: 'Localisation', owner: 'ليلى حسن', status: 'active', updated: '2026-11-14', progress: 0.67 },
  {
    id: 5,
    name: 'Legacy importer',
    owner: 'Alan Turing',
    status: 'archived',
    updated: '2026-08-02',
    progress: 1,
  },
  {
    id: 6,
    name: 'Accessibility audit',
    owner: 'Barbara Liskov',
    status: 'active',
    updated: '2026-11-08',
    progress: 0.9,
  },
  {
    id: 7,
    name: 'Search relevance',
    owner: 'Edsger Dijkstra',
    status: 'paused',
    updated: '2026-09-19',
    progress: 0.2,
  },
])

const query = ref('')
const status = ref<Status | 'all' | null>('all')
const sort = ref<UiTableSort | null>({ key: 'updated', direction: 'descending' })
const page = ref(1)
const pageSize = 4
const detail = ref<Project | null>(null)
const drawerOpen = ref(false)

const STATUS_COLOR: Readonly<Record<Status, UiColor>> = {
  active: 'success',
  paused: 'warning',
  archived: 'neutral',
}

const statuses = computed(() => [
  { value: 'all' as const, label: t('workspace.filter.all') },
  { value: 'active' as const, label: t('workspace.status.active') },
  { value: 'paused' as const, label: t('workspace.status.paused') },
  { value: 'archived' as const, label: t('workspace.status.archived') },
])
const columns = computed<UiTableColumn<Project>[]>(() => [
  { key: 'name', header: t('workspace.col.name'), sortable: true, rowHeader: true },
  { key: 'owner', header: t('workspace.col.owner'), sortable: true },
  { key: 'status', header: t('workspace.col.status') },
  { key: 'progress', header: t('workspace.col.progress'), width: '9rem' },
  { key: 'updated', header: t('workspace.col.updated'), sortable: true, align: 'end' },
  { key: 'actions', header: t('workspace.actions'), align: 'end', width: '3rem' },
])
const crumbs = computed(() => [
  { label: t('workspace.title'), href: '#/overview' },
  { label: t('workspace.projects') },
])
const rowMenu = computed<UiMenuItem[]>(() => [
  { id: 'rename', label: t('workspace.action.rename') },
  { id: 'duplicate', label: t('workspace.action.duplicate') },
  { id: 'archive', label: t('workspace.action.archive') },
  { id: 'delete', label: t('workspace.action.delete'), color: 'error' },
])

const filtered = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase()
  const list = projects.value.filter(
    (project) =>
      (status.value === 'all' || status.value === null || project.status === status.value) &&
      (needle === '' || `${project.name} ${project.owner}`.toLocaleLowerCase().includes(needle)),
  )
  const current = sort.value
  if (!current) return list
  const direction = current.direction === 'ascending' ? 1 : -1
  const key = current.key as keyof Project
  return list.toSorted((a, b) => String(a[key]).localeCompare(String(b[key])) * direction)
})
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const visible = computed(() => {
  const current = Math.min(page.value, pageCount.value)
  return filtered.value.slice((current - 1) * pageSize, current * pageSize)
})

// Dates stay date-only strings; formatting names the calendar day explicitly in UTC.
const dateFormat = computed(
  () =>
    new Intl.DateTimeFormat(document.documentElement.lang || 'en', { dateStyle: 'medium', timeZone: 'UTC' }),
)
const formatDate = (value: string): string => dateFormat.value.format(new Date(`${value}T00:00:00Z`))

function showDetails(project: Project): void {
  detail.value = project
  drawerOpen.value = true
}

function act(project: Project, item: UiMenuItem): void {
  if (item.id === 'delete') projects.value = projects.value.filter((entry) => entry.id !== project.id)
  else if (item.id === 'archive') project.status = 'archived'
  else if (item.id === 'duplicate') {
    projects.value.push({ ...project, id: Math.max(...projects.value.map((entry) => entry.id)) + 1 })
  }
}

function create(): void {
  const id = Math.max(0, ...projects.value.map((entry) => entry.id)) + 1
  projects.value.unshift({
    id,
    name: `${t('workspace.new')} ${id}`,
    owner: 'Ada Lovelace',
    status: 'active',
    updated: '2026-11-15',
    progress: 0,
  })
  toast.add({ title: t('workspace.created'), color: 'success' })
}
</script>

<template>
  <!-- The section is the size container; `@2xl:`/`@4xl:` variants below query it. -->
  <section
    class="@container rounded-vui-lg border border-vui-border bg-vui-surface"
    :aria-label="t('workspace.title')"
    data-testid="workspace"
  >
    <div class="grid @4xl:grid-cols-[13rem_minmax(0,1fr)]">
      <aside class="border-b border-vui-border p-3 @4xl:border-e @4xl:border-b-0">
        <h3 class="mb-2 px-1 text-vui-sm font-semibold">{{ t('workspace.projects') }}</h3>
        <!-- Stacked list on wide containers, a horizontally scrolling strip on narrow ones. -->
        <ul class="flex gap-1 overflow-x-auto @4xl:flex-col @4xl:overflow-visible">
          <li v-for="entry in statuses" :key="entry.value" class="shrink-0">
            <UiButton
              block
              size="sm"
              :variant="status === entry.value ? 'soft' : 'ghost'"
              color="neutral"
              class="justify-start"
              :aria-pressed="status === entry.value ? 'true' : 'false'"
              @click="((status = entry.value), (page = 1))"
            >
              {{ entry.label }}
            </UiButton>
          </li>
        </ul>
      </aside>

      <div class="grid min-w-0 gap-3 p-3">
        <UiBreadcrumbs :items="crumbs" />

        <div class="flex flex-wrap items-end gap-2">
          <UiInput
            v-model="query"
            class="min-w-40 flex-1"
            type="search"
            hide-label
            :label="t('workspace.search')"
            :placeholder="t('workspace.search')"
            @input="page = 1"
          >
            <template #leading><UiIcon :icon="iconSearch" /></template>
          </UiInput>
          <!-- The select duplicates the sidebar filter for containers too narrow to show it comfortably. -->
          <UiSelect
            v-model="status"
            class="w-36 @4xl:hidden"
            :options="statuses"
            hide-label
            :label="t('workspace.filter')"
          />
          <UiButton data-testid="workspace-new" @click="create">
            <template #leading><UiIcon :icon="iconPlus" /></template>
            {{ t('workspace.new') }}
          </UiButton>
        </div>

        <UiEmptyState
          v-if="filtered.length === 0"
          :title="t('workspace.empty')"
          :description="t('workspace.empty.hint')"
        />
        <template v-else>
          <!-- Real table markup at every size: on narrow containers it scrolls inside its labelled region. -->
          <UiTable
            v-model:sort="sort"
            :columns="columns"
            :rows="visible"
            row-key="id"
            :caption="t('workspace.caption')"
            hide-caption
          >
            <template #cell-name="{ row }">
              <button
                type="button"
                class="rounded-vui-sm text-start font-medium underline decoration-vui-border-strong underline-offset-4"
                @click="showDetails(row)"
              >
                {{ row.name }}
              </button>
            </template>
            <template #cell-status="{ row }">
              <UiBadge :color="STATUS_COLOR[row.status]" dot>{{
                t(`workspace.status.${row.status}`)
              }}</UiBadge>
            </template>
            <template #cell-progress="{ row }">
              <UiProgress
                :value="row.progress"
                :max="1"
                size="sm"
                :aria-label="`${t('workspace.col.progress')}: ${row.name}`"
              />
            </template>
            <template #cell-updated="{ row }">
              <time :datetime="row.updated" class="whitespace-nowrap">{{ formatDate(row.updated) }}</time>
            </template>
            <template #cell-actions="{ row }">
              <UiDropdownMenu
                :items="rowMenu"
                placement="bottom-end"
                :label="`${t('workspace.actions')}: ${row.name}`"
                @select="act(row, $event)"
              >
                <template #custom-trigger="{ attrs, on, ref: setTrigger }">
                  <button
                    :ref="setTrigger"
                    type="button"
                    v-bind="attrs"
                    class="inline-flex items-center justify-center rounded-vui-sm text-vui-muted hover:bg-vui-hover"
                    style="
                      inline-size: max(1.75rem, var(--vui-hit-min));
                      block-size: max(1.75rem, var(--vui-hit-min));
                    "
                    :aria-label="`${t('workspace.actions')}: ${row.name}`"
                    v-on="on"
                  >
                    <UiIcon :icon="iconMore" />
                  </button>
                </template>
              </UiDropdownMenu>
            </template>
          </UiTable>
          <UiPagination v-model:page="page" :page-count="pageCount" size="sm" />
        </template>
      </div>
    </div>

    <UiDrawer
      v-model:open="drawerOpen"
      :title="detail?.name ?? t('workspace.details')"
      :description="t('workspace.drawer.description')"
      size="sm"
    >
      <UiCard v-if="detail" variant="plain" padding="none">
        <dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-vui-sm">
          <dt class="text-vui-muted">{{ t('workspace.col.owner') }}</dt>
          <dd>{{ detail.owner }}</dd>
          <dt class="text-vui-muted">{{ t('workspace.col.status') }}</dt>
          <dd>
            <UiBadge :color="STATUS_COLOR[detail.status]" dot>{{
              t(`workspace.status.${detail.status}`)
            }}</UiBadge>
          </dd>
          <dt class="text-vui-muted">{{ t('workspace.col.updated') }}</dt>
          <dd><time :datetime="detail.updated">{{ formatDate(detail.updated) }}</time></dd>
          <dt class="text-vui-muted">{{ t('workspace.col.progress') }}</dt>
          <dd>
            <UiProgress :value="detail.progress" :max="1" show-value :label="t('workspace.col.progress')" />
          </dd>
        </dl>
      </UiCard>
      <template #footer="{ close }">
        <UiButton @click="close">{{ t('actions.done') }}</UiButton>
      </template>
    </UiDrawer>
  </section>
</template>
