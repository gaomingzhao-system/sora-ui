<script setup lang="ts" vapor>
/**
 * A small application screen that adapts to its *container*, not the
 * viewport: sidebar and content sit side by side when there is room and
 * stack when there is not, wherever the example is placed.
 */
import { computed, ref } from 'vue'
import {
  SoraBadge,
  SoraBreadcrumbs,
  SoraButton,
  SoraCard,
  SoraDrawer,
  SoraDropdownMenu,
  SoraEmptyState,
  SoraIcon,
  SoraInput,
  SoraPagination,
  SoraProgress,
  SoraSelect,
  SoraTable,
  iconMore,
  iconPlus,
  iconSearch,
  useToast,
  useSoraLocale,
  type SoraColor,
  type SoraMenuItem,
  type SoraTableColumn,
  type SoraTableSort,
} from '@your-scope/ui'
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
const { locale } = useSoraLocale()

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
const sort = ref<SoraTableSort | null>({ key: 'updated', direction: 'descending' })
const page = ref(1)
const pageSize = 4
const detail = ref<Project | null>(null)
const drawerOpen = ref(false)

const STATUS_COLOR: Readonly<Record<Status, SoraColor>> = {
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
const columns = computed<SoraTableColumn<Project>[]>(() => [
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
const rowMenu = computed<SoraMenuItem[]>(() => [
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
  () => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeZone: 'UTC' }),
)
const formatDate = (value: string): string => dateFormat.value.format(new Date(`${value}T00:00:00Z`))

const showDetails = (project: Project): void => {
  detail.value = project
  drawerOpen.value = true
}

const act = (project: Project, item: SoraMenuItem): void => {
  if (item.id === 'delete') projects.value = projects.value.filter((entry) => entry.id !== project.id)
  else if (item.id === 'archive') project.status = 'archived'
  else if (item.id === 'duplicate') {
    projects.value.push({ ...project, id: Math.max(...projects.value.map((entry) => entry.id)) + 1 })
  }
}

const create = (): void => {
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
    class="@container rounded-sora-lg border border-sora-border bg-sora-surface"
    :aria-label="t('workspace.title')"
    data-testid="workspace"
  >
    <div class="grid @4xl:grid-cols-[13rem_minmax(0,1fr)]">
      <aside class="border-b border-sora-border p-3 @4xl:border-e @4xl:border-b-0">
        <h3 class="mb-2 px-1 text-sora-sm font-semibold">{{ t('workspace.projects') }}</h3>
        <!-- Stacked list on wide containers, a horizontally scrolling strip on narrow ones. -->
        <ul class="flex gap-1 overflow-x-auto @4xl:flex-col @4xl:overflow-visible">
          <li v-for="entry in statuses" :key="entry.value" class="shrink-0">
            <SoraButton
              block
              size="sm"
              :variant="status === entry.value ? 'soft' : 'ghost'"
              color="neutral"
              class="justify-start"
              :aria-pressed="status === entry.value ? 'true' : 'false'"
              @click="((status = entry.value), (page = 1))"
            >
              {{ entry.label }}
            </SoraButton>
          </li>
        </ul>
      </aside>

      <div class="grid min-w-0 gap-3 p-3">
        <SoraBreadcrumbs :items="crumbs" />

        <div class="flex flex-wrap items-end gap-2">
          <SoraInput
            v-model="query"
            class="min-w-40 flex-1"
            type="search"
            hide-label
            :label="t('workspace.search')"
            :placeholder="t('workspace.search')"
            @input="page = 1"
          >
            <template #leading><SoraIcon :icon="iconSearch" /></template>
          </SoraInput>
          <!-- The select duplicates the sidebar filter for containers too narrow to show it comfortably. -->
          <SoraSelect
            v-model="status"
            class="w-36 @4xl:hidden"
            :options="statuses"
            hide-label
            :label="t('workspace.filter')"
          />
          <SoraButton data-testid="workspace-new" @click="create">
            <template #leading><SoraIcon :icon="iconPlus" /></template>
            {{ t('workspace.new') }}
          </SoraButton>
        </div>

        <SoraEmptyState
          v-if="filtered.length === 0"
          :title="t('workspace.empty')"
          :description="t('workspace.empty.hint')"
        />
        <template v-else>
          <!-- Real table markup at every size: on narrow containers it scrolls inside its labelled region. -->
          <SoraTable
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
                class="rounded-sora-sm text-start font-medium underline decoration-sora-border-strong underline-offset-4"
                @click="showDetails(row)"
              >
                {{ row.name }}
              </button>
            </template>
            <template #cell-status="{ row }">
              <SoraBadge :color="STATUS_COLOR[row.status]" dot>{{
                t(`workspace.status.${row.status}`)
              }}</SoraBadge>
            </template>
            <template #cell-progress="{ row }">
              <SoraProgress
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
              <SoraDropdownMenu
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
                    class="inline-flex items-center justify-center rounded-sora-sm text-sora-muted hover:bg-sora-hover"
                    style="
                      inline-size: max(1.75rem, var(--sora-hit-min));
                      block-size: max(1.75rem, var(--sora-hit-min));
                    "
                    :aria-label="`${t('workspace.actions')}: ${row.name}`"
                    v-on="on"
                  >
                    <SoraIcon :icon="iconMore" />
                  </button>
                </template>
              </SoraDropdownMenu>
            </template>
          </SoraTable>
          <SoraPagination v-model:page="page" :page-count="pageCount" size="sm" />
        </template>
      </div>
    </div>

    <SoraDrawer
      v-model:open="drawerOpen"
      :title="detail?.name ?? t('workspace.details')"
      :description="t('workspace.drawer.description')"
      size="sm"
    >
      <SoraCard v-if="detail" variant="plain" padding="none">
        <dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sora-sm">
          <dt class="text-sora-muted">{{ t('workspace.col.owner') }}</dt>
          <dd>{{ detail.owner }}</dd>
          <dt class="text-sora-muted">{{ t('workspace.col.status') }}</dt>
          <dd>
            <SoraBadge :color="STATUS_COLOR[detail.status]" dot>{{
              t(`workspace.status.${detail.status}`)
            }}</SoraBadge>
          </dd>
          <dt class="text-sora-muted">{{ t('workspace.col.updated') }}</dt>
          <dd><time :datetime="detail.updated">{{ formatDate(detail.updated) }}</time></dd>
          <dt class="text-sora-muted">{{ t('workspace.col.progress') }}</dt>
          <dd>
            <SoraProgress :value="detail.progress" :max="1" show-value :label="t('workspace.col.progress')" />
          </dd>
        </dl>
      </SoraCard>
      <template #footer="{ close }">
        <SoraButton @click="close">{{ t('actions.done') }}</SoraButton>
      </template>
    </SoraDrawer>
  </section>
</template>
