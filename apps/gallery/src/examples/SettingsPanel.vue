<script setup lang="ts" vapor>
/**
 * A compact settings panel: tabs, inputs, switches, a table and a confirmation
 * dialog in one card. It shows how dense the library is in a real layout.
 */
import { computed, ref, watch } from 'vue'
import {
  UiAlert,
  UiAvatar,
  UiButton,
  UiCard,
  UiDialog,
  UiInput,
  UiNumberInput,
  UiSelect,
  UiSwitch,
  UiTable,
  UiTabs,
  useToast,
} from '@your-scope/ui'
import type { UiTableColumn } from '@your-scope/ui'
import { useT } from '../i18n.ts'

type Role = 'owner' | 'editor' | 'viewer'
interface Member {
  id: number
  name: string
  role: Role
}

const t = useT()
const toast = useToast()

const section = ref('general')
const name = ref('Acme Research')
const region = ref<'eu' | 'us' | 'jp' | null>('eu')
const retention = ref<number | null>(90)
const digests = ref(true)
const mentions = ref(false)
const confirmOpen = ref(false)
const members = ref<Member[]>([
  { id: 1, name: 'Ada Lovelace', role: 'owner' },
  { id: 2, name: 'Grace Hopper', role: 'editor' },
  { id: 3, name: '山田 太郎', role: 'viewer' },
])

const sections = computed(() => [
  { value: 'general', label: t('settings.general') },
  { value: 'notifications', label: t('settings.notifications') },
  { value: 'members', label: t('settings.members') },
])
const regions = computed(() => [
  { value: 'eu' as const, label: t('settings.region.eu') },
  { value: 'us' as const, label: t('settings.region.us') },
  { value: 'jp' as const, label: t('settings.region.jp') },
])
const roles = computed(() => [
  { value: 'owner' as const, label: t('settings.role.owner') },
  { value: 'editor' as const, label: t('settings.role.editor') },
  { value: 'viewer' as const, label: t('settings.role.viewer') },
])
const columns = computed<UiTableColumn<Member>[]>(() => [
  { key: 'name', header: t('settings.member'), rowHeader: true },
  { key: 'role', header: t('settings.role'), width: '10rem' },
])

// "Saved automatically": one toast, replaced rather than stacked while the user keeps editing.
watch(
  [name, region, retention, digests, mentions, members],
  () => {
    toast.add({ id: 'settings-saved', title: t('settings.saved'), color: 'success', duration: 2500 })
  },
  { deep: true },
)

function setRole(member: Member, role: Role | null): void {
  if (role) member.role = role
}
</script>

<template>
  <UiCard
    as="section"
    :title="t('settings.title')"
    :description="t('settings.description')"
    data-testid="settings-panel"
  >
    <UiTabs v-model="section" :items="sections" :label="t('settings.title')" size="sm">
      <template #content="{ item }">
        <div v-if="item.value === 'general'" class="grid gap-3">
          <UiInput
            v-model="name"
            :label="t('settings.name')"
            :hint="t('settings.name.hint')"
            orientation="horizontal"
          />
          <div class="grid gap-3 sm:grid-cols-2">
            <UiSelect v-model="region" :options="regions" :label="t('settings.region')" />
            <UiNumberInput
              v-model="retention"
              :label="t('settings.retention')"
              :min="1"
              :max="365"
              controls
            />
          </div>
          <UiAlert
            color="error"
            variant="outline"
            announce="off"
            :title="t('settings.danger')"
            :description="t('settings.danger.description')"
          >
            <template #actions>
              <UiButton
                size="sm"
                color="error"
                variant="outline"
                data-testid="settings-delete"
                @click="confirmOpen = true"
              >
                {{ t('settings.danger.action') }}
              </UiButton>
            </template>
          </UiAlert>
        </div>

        <div v-else-if="item.value === 'notifications'" class="grid gap-1">
          <UiSwitch
            v-model="digests"
            :label="t('settings.email')"
            :hint="t('settings.email.hint')"
            label-placement="start"
          />
          <UiSwitch
            v-model="mentions"
            :label="t('settings.mentions')"
            :hint="t('settings.mentions.hint')"
            label-placement="start"
          />
        </div>

        <div v-else class="grid gap-3">
          <UiTable
            :columns="columns"
            :rows="members"
            row-key="id"
            :caption="t('settings.members.caption')"
            hide-caption
            size="sm"
          >
            <template #cell-name="{ row }">
              <span class="flex items-center gap-2"
                ><UiAvatar :name="row.name" size="sm" />{{ row.name }}</span
              >
            </template>
            <template #cell-role="{ row }">
              <UiSelect
                :model-value="row.role"
                :options="roles"
                size="sm"
                hide-label
                :label="`${t('settings.role')}: ${row.name}`"
                @update:model-value="setRole(row, $event)"
              />
            </template>
          </UiTable>
          <UiButton class="justify-self-start" size="sm" variant="outline" color="neutral">{{
            t('settings.invite')
          }}</UiButton>
        </div>
      </template>
    </UiTabs>

    <UiDialog
      v-model:open="confirmOpen"
      role="alertdialog"
      size="sm"
      :title="t('settings.danger.confirm')"
      :description="t('settings.danger.description')"
      :closable="false"
    >
      <template #footer="{ close }">
        <UiButton variant="ghost" color="neutral" data-autofocus @click="close">{{
          t('actions.cancel')
        }}</UiButton>
        <UiButton color="error" @click="close">{{ t('settings.danger.action') }}</UiButton>
      </template>
    </UiDialog>
  </UiCard>
</template>
