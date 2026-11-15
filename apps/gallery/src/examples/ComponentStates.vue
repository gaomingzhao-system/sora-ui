<script setup lang="ts" vapor>
/** The same components in their default, disabled, loading, invalid and long-content states. */
import { ref } from 'vue'
import {
  UiAlert,
  UiBadge,
  UiButton,
  UiCard,
  UiCheckbox,
  UiInput,
  UiSelect,
  UiSwitch,
  UiTextarea,
} from '@your-scope/ui'
import { useT } from '../i18n.ts'

const t = useT()
const text = ref('Ada')
const choice = ref<string | null>('a')
const on = ref(true)
const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
]
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="component-states">
    <UiCard variant="outline" padding="sm" :title="t('demo.default')" :heading-level="4">
      <div class="grid gap-2">
        <UiButton>{{ t('demo.save') }}</UiButton>
        <UiInput v-model="text" :label="t('demo.name')" />
        <UiSelect v-model="choice" :options="options" :label="t('demo.plan')" />
        <UiCheckbox v-model="on" :label="t('demo.terms')" />
        <UiSwitch v-model="on" :label="t('demo.notifications')" />
      </div>
    </UiCard>

    <UiCard variant="outline" padding="sm" :title="t('demo.disabled')" :heading-level="4">
      <div class="grid gap-2">
        <UiButton disabled>{{ t('demo.save') }}</UiButton>
        <UiInput v-model="text" :label="t('demo.name')" disabled />
        <UiSelect v-model="choice" :options="options" :label="t('demo.plan')" disabled />
        <UiCheckbox v-model="on" :label="t('demo.terms')" disabled />
        <UiSwitch v-model="on" :label="t('demo.notifications')" disabled />
      </div>
    </UiCard>

    <UiCard variant="outline" padding="sm" :title="t('demo.loading')" :heading-level="4">
      <div class="grid gap-2">
        <UiButton loading>{{ t('demo.save') }}</UiButton>
        <UiButton loading variant="outline" color="neutral">{{ t('demo.cancel') }}</UiButton>
        <UiButton loading variant="soft" color="secondary" block>{{ t('demo.continue') }}</UiButton>
      </div>
    </UiCard>

    <UiCard variant="outline" padding="sm" :title="t('demo.invalid')" :heading-level="4">
      <div class="grid gap-2">
        <UiInput v-model="text" :label="t('demo.name')" :error="t('validation.invalid')" />
        <UiSelect
          v-model="choice"
          :options="options"
          :label="t('demo.plan')"
          :error="t('validation.required')"
        />
        <UiCheckbox :model-value="false" :label="t('demo.terms')" :error="t('validation.accepted')" />
        <UiTextarea :model-value="''" :label="t('demo.message')" :rows="2" invalid />
      </div>
    </UiCard>

    <UiCard variant="outline" padding="sm" :title="t('demo.long')" :heading-level="4">
      <div class="grid gap-2">
        <UiButton>{{ t('demo.long') }}</UiButton>
        <UiInput v-model="text" :label="t('demo.long')" :hint="t('demo.long')" />
        <UiCheckbox v-model="on" :label="t('demo.long')" />
        <UiBadge>{{ t('demo.long') }}</UiBadge>
        <UiAlert announce="off" :title="t('demo.long')" :description="t('demo.long')" />
      </div>
    </UiCard>
  </div>
</template>
