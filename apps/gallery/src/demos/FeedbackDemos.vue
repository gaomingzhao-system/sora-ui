<script setup lang="ts" vapor>
import { ref } from 'vue'
import { SoraAlert, SoraButton, SoraProgress, SoraSkeleton, SoraSpinner, useToast } from '@your-scope/ui'
import DemoSection from '../components/DemoSection.vue'
import { useT } from '../i18n.ts'

const t = useT()
const toast = useToast()
const dismissed = ref(true)
const progress = ref(64)
const intents = ['info', 'success', 'warning', 'error'] as const
</script>

<template>
  <DemoSection name="SoraAlert">
    <div class="grid gap-2 md:grid-cols-2">
      <SoraAlert
        v-for="intent in intents"
        :key="intent"
        :color="intent"
        announce="off"
        :title="t(`demo.alert.title.${intent}`)"
        :description="t(`demo.alert.${intent}`)"
      />
      <SoraAlert
        v-model:open="dismissed"
        color="warning"
        variant="outline"
        announce="off"
        dismissible
        :title="t('demo.alert.title.warning')"
      >
        {{ t('demo.alert.warning') }}
        <template #actions>
          <SoraButton size="sm" variant="outline" color="warning">{{ t('demo.continue') }}</SoraButton>
        </template>
      </SoraAlert>
      <SoraAlert
        color="error"
        variant="solid"
        announce="off"
        :title="t('demo.alert.title.error')"
        :description="t('demo.alert.error')"
      />
    </div>
  </DemoSection>

  <DemoSection name="SoraSpinner">
    <div class="flex items-center gap-4">
      <SoraSpinner size="sm" />
      <SoraSpinner />
      <SoraSpinner size="lg" class="text-sora-secondary-text" />
    </div>
  </DemoSection>

  <DemoSection name="SoraProgress">
    <div class="grid max-w-md gap-4">
      <SoraProgress :value="progress" :label="t('demo.progress.upload')" show-value />
      <SoraProgress :label="t('demo.progress.prepare')" color="secondary" size="sm" />
      <SoraProgress :value="100" color="success" size="lg" />
      <SoraButton
        class="justify-self-start"
        size="sm"
        variant="outline"
        color="neutral"
        @click="progress = (progress + 12) % 112"
      >
        {{ t('demo.continue') }}
      </SoraButton>
    </div>
  </DemoSection>

  <DemoSection name="SoraSkeleton">
    <div class="flex max-w-md items-start gap-3" aria-busy="true">
      <SoraSkeleton shape="circle" />
      <div class="grid flex-1 gap-2">
        <SoraSkeleton :lines="3" />
        <SoraSkeleton shape="rect" height="3rem" />
      </div>
    </div>
  </DemoSection>

  <DemoSection name="SoraToastProvider">
    <div class="flex flex-wrap gap-2">
      <SoraButton
        variant="outline"
        color="neutral"
        data-testid="toast-show"
        @click="
          toast.add({
            title: t('demo.toast.title'),
            description: t('demo.toast.body'),
            color: 'success',
            action: { label: t('demo.toast.undo'), onClick: () => {} },
          })
        "
      >
        {{ t('demo.toast.show') }}
      </SoraButton>
      <SoraButton
        variant="outline"
        color="error"
        data-testid="toast-urgent"
        @click="
          toast.add({
            title: t('demo.toast.urgent.title'),
            description: t('demo.toast.urgent.body'),
            color: 'error',
            urgent: true,
          })
        "
      >
        {{ t('demo.toast.urgent') }}
      </SoraButton>
      <SoraButton
        variant="outline"
        color="neutral"
        data-testid="toast-persistent"
        @click="toast.add({ title: t('demo.toast.title'), duration: 0 })"
      >
        {{ t('demo.toast.persistent') }}
      </SoraButton>
    </div>
  </DemoSection>
</template>
