<script setup lang="ts" vapor>
/** The same components in their default, disabled, loading, invalid and long-content states. */
import { ref } from 'vue'
import {
  SoraAlert,
  SoraBadge,
  SoraButton,
  SoraCard,
  SoraCheckbox,
  SoraInput,
  SoraSelect,
  SoraSwitch,
  SoraTextarea,
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
    <SoraCard variant="outline" padding="sm" :title="t('demo.default')" :heading-level="3">
      <div class="grid gap-2">
        <SoraButton>{{ t('demo.save') }}</SoraButton>
        <SoraInput v-model="text" :label="t('demo.name')" />
        <SoraSelect v-model="choice" :options="options" :label="t('demo.plan')" />
        <SoraCheckbox v-model="on" :label="t('demo.terms')" />
        <SoraSwitch v-model="on" :label="t('demo.notifications')" />
      </div>
    </SoraCard>

    <SoraCard variant="outline" padding="sm" :title="t('demo.disabled')" :heading-level="3">
      <div class="grid gap-2">
        <SoraButton disabled>{{ t('demo.save') }}</SoraButton>
        <SoraInput v-model="text" :label="t('demo.name')" disabled />
        <SoraSelect v-model="choice" :options="options" :label="t('demo.plan')" disabled />
        <SoraCheckbox v-model="on" :label="t('demo.terms')" disabled />
        <SoraSwitch v-model="on" :label="t('demo.notifications')" disabled />
      </div>
    </SoraCard>

    <SoraCard variant="outline" padding="sm" :title="t('demo.loading')" :heading-level="3">
      <div class="grid gap-2">
        <SoraButton loading>{{ t('demo.save') }}</SoraButton>
        <SoraButton loading variant="outline" color="neutral">{{ t('demo.cancel') }}</SoraButton>
        <SoraButton loading variant="soft" color="secondary" block>{{ t('demo.continue') }}</SoraButton>
      </div>
    </SoraCard>

    <SoraCard variant="outline" padding="sm" :title="t('demo.invalid')" :heading-level="3">
      <div class="grid gap-2">
        <SoraInput v-model="text" :label="t('demo.name')" :error="t('validation.invalid')" />
        <SoraSelect
          v-model="choice"
          :options="options"
          :label="t('demo.plan')"
          :error="t('validation.required')"
        />
        <SoraCheckbox :model-value="false" :label="t('demo.terms')" :error="t('validation.accepted')" />
        <SoraTextarea :model-value="''" :label="t('demo.message')" :rows="2" invalid />
      </div>
    </SoraCard>

    <SoraCard variant="outline" padding="sm" :title="t('demo.long')" :heading-level="3">
      <div class="grid gap-2">
        <SoraButton>{{ t('demo.long') }}</SoraButton>
        <SoraInput v-model="text" :label="t('demo.long')" :hint="t('demo.long')" />
        <SoraCheckbox v-model="on" :label="t('demo.long')" />
        <SoraBadge>{{ t('demo.long') }}</SoraBadge>
        <SoraAlert announce="off" :title="t('demo.long')" :description="t('demo.long')" />
      </div>
    </SoraCard>
  </div>
</template>
