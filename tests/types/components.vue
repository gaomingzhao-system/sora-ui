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
  SoraAccordion,
  SoraAlert,
  SoraBadge,
  SoraButton,
  SoraCard,
  SoraCheckbox,
  SoraCombobox,
  SoraDialog,
  SoraDrawer,
  SoraDropdownMenu,
  SoraIconButton,
  SoraInput,
  SoraNumberInput,
  SoraPagination,
  SoraPopover,
  SoraProvider,
  SoraSelect,
  SoraTable,
  SoraTabs,
  iconPlus,
  type SoraCloseReason,
  type SoraMenuItem,
  type SoraOption,
  type SoraTableColumn,
  type SoraTableSort,
} from '@your-scope/ui'

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
const roles: SoraOption<Role>[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
]
const people: Person[] = [{ id: 1, name: 'Ada', role: 'admin' }]
const columns: SoraTableColumn<Person>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role' },
]
const sort = ref<SoraTableSort | null>(null)
const selected = ref<(string | number)[]>([])
const tab = ref<'a' | 'b'>('a')
const tabs = [
  { value: 'a' as const, label: 'A' },
  { value: 'b' as const, label: 'B' },
]
const open = ref(false)
const expanded = ref<string[]>([])
const page = ref(1)
const menu: SoraMenuItem[] = [{ id: 'edit', label: 'Edit' }]

const dialog = useTemplateRef('dialog')
const input = useTemplateRef('input')
const button = useTemplateRef('button')

const onClick = (event: MouseEvent): number => event.clientX
const onClose = (reason: SoraCloseReason): SoraCloseReason => reason
const onRole = (value: Role | null): void => {
  role.value = value
}
const wrongClose = (reason: number): number => reason

// Exposed members are typed: methods exist and the element is the native one.
const useExposed = (): void => {
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
  <SoraButton
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
  </SoraButton>
  <SoraIconButton label="Add" :icon="iconPlus" />
  <SoraInput ref="input" v-model="text" label="Email" type="email" autocomplete="email" inputmode="email" />
  <SoraNumberInput v-model="amount" label="Amount" :min="0" :step="0.5" />
  <SoraCheckbox v-model="accepted" label="Accept" />
  <SoraSelect :model-value="role" :options="roles" label="Role" @update:model-value="onRole" />
  <SoraCombobox
    v-model="role"
    :options="roles"
    label="Role"
    @select="(option) => option?.value satisfies Role | undefined"
  />
  <SoraTabs v-model="tab" :items="tabs" label="Sections">
    <template #content="{ item }">{{ item.value satisfies 'a' | 'b' }}</template>
  </SoraTabs>
  <SoraAccordion v-model="expanded" :items="[{ value: 'q', label: 'Q', content: 'A' }]" />
  <SoraPagination v-model:page="page" :page-count="4" />
  <SoraTable
    v-model:sort="sort"
    v-model:selected="selected"
    :columns="columns"
    :rows="people"
    row-key="id"
    selectable
  >
    <template #cell-name="{ row, index }">{{ row.name.toUpperCase() }} {{ index.toFixed(0) }}</template>
    <template #cell="{ row, column }">{{ row.role satisfies Role }} {{ column.header }}</template>
  </SoraTable>
  <SoraDialog ref="dialog" v-model:open="open" title="Settings" size="lg" @close="onClose">
    <template #footer="{ close }"><SoraButton @click="close">Done</SoraButton></template>
  </SoraDialog>
  <!-- Inline handlers get the component's payload type, not the native event's. -->
  <SoraDialog v-model:open="open" title="Settings" @close="(reason) => reason satisfies SoraCloseReason" />
  <SoraDrawer
    v-model:open="open"
    title="Filters"
    side="end"
    @close="(reason) => reason satisfies SoraCloseReason"
  />
  <SoraPopover v-model:open="open" label="More">
    <template #default="{ close }"><SoraButton @click="close">Close</SoraButton></template>
  </SoraPopover>
  <SoraDropdownMenu :items="menu" label="Actions" @select="(item) => item.id satisfies string" />
  <SoraAlert color="warning" variant="soft" title="Heads up" />
  <SoraBadge color="success" variant="outline">New</SoraBadge>
  <SoraCard title="Title" variant="elevated" padding="lg" as="section" />
  <SoraProvider
    color-mode="dark"
    density="comfortable"
    :defaults="{ button: { size: 'lg' } }"
    :theme-vars="{ '--sora-primary': 'red' }"
  />

  <!-- ---------------------------------------------------- must not type-check -->
  <!-- @vue-expect-error unknown variant -->
  <SoraButton variant="fancy">Save</SoraButton>
  <!-- @vue-expect-error unknown size -->
  <SoraButton size="xl">Save</SoraButton>
  <!-- @vue-expect-error not a prop and not a button attribute -->
  <SoraButton colour="primary">Save</SoraButton>
  <!-- @vue-expect-error an icon-only button must have a label -->
  <SoraIconButton :icon="iconPlus" />
  <!-- @vue-expect-error the model of a text input is a string -->
  <SoraInput :model-value="5" label="Email" />
  <!-- @vue-expect-error a number input cannot write into a string ref -->
  <SoraNumberInput v-model="text" label="Amount" />
  <!-- @vue-expect-error a checkbox model is a boolean -->
  <SoraCheckbox :model-value="'yes'" label="Accept" />
  <!-- @vue-expect-error the handler receives the option type (or null), not a number -->
  <SoraSelect :model-value="role" :options="roles" @update:model-value="(value: number) => value" />
  <!-- @vue-expect-error rowKey must be a property of the row type -->
  <SoraTable :columns="columns" :rows="people" row-key="missing" />
  <SoraTable :columns="columns" :rows="people" row-key="id">
    <template #cell-name="{ row }">
      <!-- @vue-expect-error slot props carry the row type -->
      <span :title="row.missing" />
    </template>
  </SoraTable>
  <!-- @vue-expect-error a dialog needs a title (its accessible name) -->
  <SoraDialog v-model:open="open" />
  <!-- @vue-expect-error the close reason is a string union -->
  <SoraDialog v-model:open="open" title="Settings" @close="wrongClose" />
  <!-- @vue-expect-error tabs need items -->
  <SoraTabs v-model="tab" />
  <!-- @vue-expect-error unknown colour role -->
  <SoraAlert color="danger" />
  <!-- @vue-expect-error unknown density -->
  <SoraProvider density="tiny" />
  <!-- @vue-expect-error defaults are checked per component -->
  <SoraProvider :defaults="{ button: { size: 'huge' } }" />
</template>
