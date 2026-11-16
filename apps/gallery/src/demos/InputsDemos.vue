<script setup lang="ts" vapor>
import { computed, ref } from 'vue'
import {
  SoraCheckbox,
  SoraCheckboxGroup,
  SoraCombobox,
  SoraDateInput,
  SoraField,
  SoraFileInput,
  SoraIcon,
  SoraInput,
  SoraNumberInput,
  SoraPasswordInput,
  SoraRadioGroup,
  SoraSelect,
  SoraSlider,
  SoraSwitch,
  SoraTextarea,
  iconSearch,
} from '@your-scope/ui'
import type { SoraOption } from '@your-scope/ui'
import DemoSection from '../components/DemoSection.vue'
import { useT } from '../i18n.ts'

const t = useT()

const name = ref('Ada Lovelace')
const email = ref('ada@')
const password = ref('correct horse')
const message = ref('')
const amount = ref<number | null>(3)
const date = ref<string | null>('2026-11-15')
const terms = ref(false)
const all = ref(false)
const mixed = ref(true)
const channels = ref(['email'])
const plan = ref<'free' | 'team' | 'enterprise' | null>('team')
const dark = ref(true)
const volume = ref(40)
const files = ref<File[]>([])
const country = ref<string | null>(null)
const fruit = ref<string | null>(null)
const asyncFruit = ref<string | null>(null)
const custom = ref('')

const countries = computed(() => [
  {
    label: t('demo.region.asia'),
    options: [
      { value: 'jp', label: t('demo.country.jp') },
      { value: 'in', label: t('demo.country.in') },
      { value: 'kr', label: t('demo.country.kr') },
    ],
  },
  {
    label: t('demo.region.other'),
    options: [
      { value: 'fr', label: t('demo.country.fr') },
      { value: 'de', label: t('demo.country.de') },
      { value: 'eg', label: t('demo.country.eg') },
      { value: 'br', label: t('demo.country.br') },
      { value: 'ca', label: t('demo.country.ca'), disabled: true },
    ],
  },
])
const channelOptions = computed(() => [
  { value: 'email', label: t('demo.channel.email') },
  { value: 'push', label: t('demo.channel.push') },
  { value: 'sms', label: t('demo.channel.sms'), disabled: true },
])
const planOptions = computed(() => [
  { value: 'free' as const, label: t('demo.plan.free'), description: t('demo.plan.free.hint') },
  { value: 'team' as const, label: t('demo.plan.team'), description: t('demo.plan.team.hint') },
  { value: 'enterprise' as const, label: t('demo.plan.enterprise'), disabled: true },
])

const FRUITS = [
  'Apple',
  'Apricot',
  'Banana',
  'Blueberry',
  'Cherry',
  'Grape',
  'Lemon',
  'Mango',
  'Orange',
  'Peach',
  'Pear',
  'Plum',
]
const fruitOptions: SoraOption[] = FRUITS.map((label) => ({ value: label.toLowerCase(), label }))

/** A slow source: the signal lets the combobox cancel a superseded request. */
function searchFruit(query: string, signal: AbortSignal): Promise<SoraOption[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const needle = query.trim().toLowerCase()
      resolve(fruitOptions.filter((option) => option.label.toLowerCase().includes(needle)))
    }, 350)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}
</script>

<template>
  <DemoSection name="SoraField">
    <SoraField :label="t('demo.field.custom')" :hint="t('demo.field.hint')" class="max-w-sm">
      <template #default="{ id, describedBy }">
        <input
          :id="id"
          v-model="custom"
          :aria-describedby="describedBy"
          class="w-full rounded-sora border border-sora-border-strong bg-sora-surface px-2.5 py-1.5 text-sora-md"
        />
      </template>
    </SoraField>
  </DemoSection>

  <DemoSection name="SoraInput">
    <div class="grid max-w-2xl gap-3 sm:grid-cols-2">
      <SoraInput v-model="name" :label="t('demo.name')" autocomplete="name" required />
      <SoraInput
        v-model="email"
        type="email"
        :label="t('demo.email')"
        :hint="t('demo.email.hint')"
        :error="t('demo.email.error')"
        autocomplete="email"
      >
        <template #leading><SoraIcon :icon="iconSearch" /></template>
      </SoraInput>
      <SoraInput v-model="name" size="sm" :label="t('demo.name')" />
      <SoraInput v-model="name" :label="t('demo.disabled')" disabled />
    </div>
  </DemoSection>

  <DemoSection name="SoraTextarea">
    <div class="grid max-w-2xl gap-3 sm:grid-cols-2">
      <SoraTextarea v-model="message" :label="t('demo.message')" :rows="3" />
      <SoraTextarea
        v-model="message"
        :label="t('demo.message')"
        autosize
        :rows="2"
        :max-rows="6"
        :hint="t('demo.long')"
      />
    </div>
  </DemoSection>

  <DemoSection name="SoraPasswordInput">
    <SoraPasswordInput
      v-model="password"
      :label="t('demo.password')"
      autocomplete="new-password"
      class="max-w-xs"
    />
  </DemoSection>

  <DemoSection name="SoraNumberInput">
    <div class="grid max-w-md grid-cols-2 gap-3">
      <SoraNumberInput v-model="amount" :label="t('demo.amount')" :min="0" :max="99" controls />
      <SoraNumberInput v-model="amount" :label="t('demo.amount')" :step="0.5" />
    </div>
    <p class="mt-2 text-sora-sm text-sora-muted" data-testid="number-value">
      {{ t('demo.value', { value: String(amount) }) }}
    </p>
  </DemoSection>

  <DemoSection name="SoraDateInput">
    <SoraDateInput v-model="date" :label="t('demo.date')" min="2026-01-01" class="max-w-xs" />
    <p class="mt-2 text-sora-sm text-sora-muted">{{ t('demo.value', { value: String(date) }) }}</p>
  </DemoSection>

  <DemoSection name="SoraCheckbox">
    <div class="grid gap-1">
      <SoraCheckbox v-model="terms" :label="t('demo.terms')" :hint="t('demo.email.hint')" />
      <SoraCheckbox v-model="all" v-model:indeterminate="mixed" :label="t('demo.selectAll')" />
      <SoraCheckbox :model-value="true" :label="t('demo.disabled')" disabled />
      <SoraCheckbox
        :model-value="false"
        :label="t('demo.invalid')"
        :error="t('validation.accepted')"
        required
      />
    </div>
  </DemoSection>

  <DemoSection name="SoraCheckboxGroup">
    <SoraCheckboxGroup
      v-model="channels"
      :options="channelOptions"
      :label="t('demo.notifications')"
      orientation="horizontal"
    />
    <p class="mt-2 text-sora-sm text-sora-muted">{{ t('demo.selected', { value: channels.join(', ') }) }}</p>
  </DemoSection>

  <DemoSection name="SoraRadioGroup">
    <SoraRadioGroup v-model="plan" :options="planOptions" :label="t('demo.plan')" />
  </DemoSection>

  <DemoSection name="SoraSwitch">
    <div class="grid max-w-sm gap-1">
      <SoraSwitch v-model="dark" :label="t('demo.darkMode')" />
      <SoraSwitch
        v-model="dark"
        :label="t('demo.notifications')"
        :hint="t('settings.email.hint')"
        label-placement="start"
      />
      <SoraSwitch :model-value="false" :label="t('demo.disabled')" disabled />
    </div>
  </DemoSection>

  <DemoSection name="SoraSelect">
    <div class="grid max-w-2xl gap-3 sm:grid-cols-2">
      <SoraSelect
        v-model="country"
        :options="countries"
        :label="t('demo.country')"
        :placeholder="t('demo.country.placeholder')"
      />
      <SoraSelect
        v-model="country"
        :options="countries"
        :label="t('demo.country')"
        :error="t('validation.required')"
        required
      />
    </div>
  </DemoSection>

  <DemoSection name="SoraCombobox">
    <div class="grid max-w-2xl gap-3 sm:grid-cols-2">
      <SoraCombobox
        v-model="fruit"
        :options="fruitOptions"
        :label="t('demo.fruit')"
        :placeholder="t('demo.search')"
        data-testid="combobox-local"
      />
      <SoraCombobox
        v-model="asyncFruit"
        :search="searchFruit"
        :label="t('demo.fruit.async')"
        :placeholder="t('demo.search')"
        data-testid="combobox-async"
      />
    </div>
    <p class="mt-2 text-sora-sm text-sora-muted" data-testid="combobox-value">
      {{ t('demo.selected', { value: String(fruit) }) }}
    </p>
  </DemoSection>

  <DemoSection name="SoraSlider">
    <div class="grid max-w-md gap-3">
      <SoraSlider v-model="volume" :label="t('demo.volume')" show-value />
      <SoraSlider
        v-model="volume"
        :label="t('demo.volume')"
        color="secondary"
        :step="10"
        show-value
        :format-value="(value) => `${value} %`"
      />
      <SoraSlider :model-value="30" :label="t('demo.disabled')" disabled />
    </div>
  </DemoSection>

  <DemoSection name="SoraFileInput">
    <SoraFileInput
      v-model="files"
      :label="t('demo.attachment')"
      multiple
      previews
      accept="image/*,.pdf,.txt"
      class="max-w-md"
    />
  </DemoSection>
</template>
