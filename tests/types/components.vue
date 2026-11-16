<script setup lang="ts" vapor>
/**
 * Type tests for component props, models, slots, emits and exposed members.
 *
 * This file is type-checked by vue-tsc and never rendered. Every
 * `@vue-expect-error` marks a node that must NOT compile; if such a node
 * starts to compile, the unused directive fails the run.
 */
import { ref, useTemplateRef } from 'vue'
import {
  UiAccordion,
  UiAlert,
  UiBadge,
  UiButton,
  UiCard,
  UiCheckbox,
  UiCombobox,
  UiDialog,
  UiDrawer,
  UiDropdownMenu,
  UiIconButton,
  UiInput,
  UiNumberInput,
  UiPagination,
  UiPopover,
  UiProvider,
  UiSelect,
  UiTable,
  UiTabs,
  iconPlus,
} from '@your-scope/ui'
import type { UiCloseReason, UiMenuItem, UiOption, UiTableColumn, UiTableSort } from '@your-scope/ui'

type Role = 'admin' | 'member'
interface Person {
  id: number
  name: string
  role: Role
}

const text = ref('')
const amount = ref<number | null>(null)
const accepted = ref(false)
const role = ref<Role | null>(null)
const roles: UiOption<Role>[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
]
const people: Person[] = [{ id: 1, name: 'Ada', role: 'admin' }]
const columns: UiTableColumn<Person>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role' },
]
const sort = ref<UiTableSort | null>(null)
const selected = ref<(string | number)[]>([])
const tab = ref<'a' | 'b'>('a')
const tabs = [
  { value: 'a' as const, label: 'A' },
  { value: 'b' as const, label: 'B' },
]
const open = ref(false)
const expanded = ref<string[]>([])
const page = ref(1)
const menu: UiMenuItem[] = [{ id: 'edit', label: 'Edit' }]

const dialog = useTemplateRef('dialog')
const input = useTemplateRef('input')
const button = useTemplateRef('button')

function onClick(event: MouseEvent): number {
  return event.clientX
}
function onClose(reason: UiCloseReason): UiCloseReason {
  return reason
}
function onRole(value: Role | null): void {
  role.value = value
}
function wrongClose(reason: number): number {
  return reason
}

// Exposed members are typed: methods exist and the element is the native one.
function useExposed(): void {
  dialog.value?.close()
  const nativeDialog: HTMLDialogElement | null | undefined = dialog.value?.element
  input.value?.focus({ preventScroll: true })
  input.value?.select()
  const nativeInput: HTMLInputElement | null | undefined = input.value?.element
  const nativeButton: HTMLButtonElement | null | undefined = button.value?.element
  // @ts-expect-error the dialog exposes no `open()`: opening is `v-model:open`
  dialog.value?.open()
  // @ts-expect-error the exposed element is a button, not an anchor
  const anchor: HTMLAnchorElement | null | undefined = button.value?.element
  void [nativeDialog, nativeInput, nativeButton, anchor]
}
void useExposed
</script>

<template>
  <!-- ------------------------------------------------------------ valid usage -->
  <UiButton
    ref="button"
    variant="soft"
    color="primary"
    size="sm"
    type="submit"
    name="intent"
    form="profile"
    aria-label="Save"
    data-testid="save"
    @click="onClick"
  >
    Save
  </UiButton>
  <UiIconButton label="Add" :icon="iconPlus" />
  <UiInput ref="input" v-model="text" label="Email" type="email" autocomplete="email" inputmode="email" />
  <UiNumberInput v-model="amount" label="Amount" :min="0" :step="0.5" />
  <UiCheckbox v-model="accepted" label="Accept" />
  <UiSelect :model-value="role" :options="roles" label="Role" @update:model-value="onRole" />
  <UiCombobox
    v-model="role"
    :options="roles"
    label="Role"
    @select="(option) => option?.value satisfies Role | undefined"
  />
  <UiTabs v-model="tab" :items="tabs" label="Sections">
    <template #content="{ item }">{{ item.value satisfies 'a' | 'b' }}</template>
  </UiTabs>
  <UiAccordion v-model="expanded" :items="[{ value: 'q', label: 'Q', content: 'A' }]" />
  <UiPagination v-model:page="page" :page-count="4" />
  <UiTable
    v-model:sort="sort"
    v-model:selected="selected"
    :columns="columns"
    :rows="people"
    row-key="id"
    selectable
  >
    <template #cell-name="{ row, index }">{{ row.name.toUpperCase() }} {{ index.toFixed(0) }}</template>
    <template #cell="{ row, column }">{{ row.role satisfies Role }} {{ column.header }}</template>
  </UiTable>
  <UiDialog ref="dialog" v-model:open="open" title="Settings" size="lg" @close="onClose">
    <template #footer="{ close }"><UiButton @click="close">Done</UiButton></template>
  </UiDialog>
  <!-- Inline handlers get the component's payload type, not the native event's. -->
  <UiDialog v-model:open="open" title="Settings" @close="(reason) => reason satisfies UiCloseReason" />
  <UiDrawer
    v-model:open="open"
    title="Filters"
    side="end"
    @close="(reason) => reason satisfies UiCloseReason"
  />
  <UiPopover v-model:open="open" label="More">
    <template #default="{ close }"><UiButton @click="close">Close</UiButton></template>
  </UiPopover>
  <UiDropdownMenu :items="menu" label="Actions" @select="(item) => item.id satisfies string" />
  <UiAlert color="warning" variant="soft" title="Heads up" />
  <UiBadge color="success" variant="outline">New</UiBadge>
  <UiCard title="Title" variant="elevated" padding="lg" as="section" />
  <UiProvider
    color-mode="dark"
    density="comfortable"
    :defaults="{ button: { size: 'lg' } }"
    :theme-vars="{ '--vui-primary': 'red' }"
  />

  <!-- ---------------------------------------------------- must not type-check -->
  <!-- @vue-expect-error unknown variant -->
  <UiButton variant="fancy">Save</UiButton>
  <!-- @vue-expect-error unknown size -->
  <UiButton size="xl">Save</UiButton>
  <!-- @vue-expect-error not a prop and not a button attribute -->
  <UiButton colour="primary">Save</UiButton>
  <!-- @vue-expect-error an icon-only button must have a label -->
  <UiIconButton :icon="iconPlus" />
  <!-- @vue-expect-error the model of a text input is a string -->
  <UiInput :model-value="5" label="Email" />
  <!-- @vue-expect-error a number input cannot write into a string ref -->
  <UiNumberInput v-model="text" label="Amount" />
  <!-- @vue-expect-error a checkbox model is a boolean -->
  <UiCheckbox :model-value="'yes'" label="Accept" />
  <!-- @vue-expect-error the handler receives the option type (or null), not a number -->
  <UiSelect :model-value="role" :options="roles" @update:model-value="(value: number) => value" />
  <!-- @vue-expect-error rowKey must be a property of the row type -->
  <UiTable :columns="columns" :rows="people" row-key="missing" />
  <UiTable :columns="columns" :rows="people" row-key="id">
    <template #cell-name="{ row }">
      <!-- @vue-expect-error slot props carry the row type -->
      <span :title="row.missing" />
    </template>
  </UiTable>
  <!-- @vue-expect-error a dialog needs a title (its accessible name) -->
  <UiDialog v-model:open="open" />
  <!-- @vue-expect-error the close reason is a string union -->
  <UiDialog v-model:open="open" title="Settings" @close="wrongClose" />
  <!-- @vue-expect-error tabs need items -->
  <UiTabs v-model="tab" />
  <!-- @vue-expect-error unknown colour role -->
  <UiAlert color="danger" />
  <!-- @vue-expect-error unknown density -->
  <UiProvider density="tiny" />
  <!-- @vue-expect-error defaults are checked per component -->
  <UiProvider :defaults="{ button: { size: 'huge' } }" />
</template>
