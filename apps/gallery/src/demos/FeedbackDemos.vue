<script setup lang="ts" vapor>
import { ref } from 'vue'
import { UiAlert, UiButton, UiProgress, UiSkeleton, UiSpinner, useToast } from '@your-scope/ui'
import DemoSection from '../components/DemoSection.vue'
import { useT } from '../i18n.ts'

const t = useT()
const toast = useToast()
const dismissed = ref(true)
const progress = ref(64)
const intents = ['info', 'success', 'warning', 'error'] as const
</script>

<template>
  <DemoSection name="UiAlert">
    <div class="grid gap-2 md:grid-cols-2">
      <UiAlert
        v-for="intent in intents"
        :key="intent"
        :color="intent"
        announce="off"
        :title="t(`demo.alert.title.${intent}`)"
        :description="t(`demo.alert.${intent}`)"
      />
      <UiAlert
        v-model:open="dismissed"
        color="warning"
        variant="outline"
        announce="off"
        dismissible
        :title="t('demo.alert.title.warning')"
      >
        {{ t('demo.alert.warning') }}
        <template #actions>
          <UiButton size="sm" variant="outline" color="warning">{{ t('demo.continue') }}</UiButton>
        </template>
      </UiAlert>
      <UiAlert
        color="error"
        variant="solid"
        announce="off"
        :title="t('demo.alert.title.error')"
        :description="t('demo.alert.error')"
      />
    </div>
  </DemoSection>

  <DemoSection name="UiSpinner">
    <div class="flex items-center gap-4">
      <UiSpinner size="sm" />
      <UiSpinner />
      <UiSpinner size="lg" class="text-vui-secondary-text" />
    </div>
  </DemoSection>

  <DemoSection name="UiProgress">
    <div class="grid max-w-md gap-4">
      <UiProgress :value="progress" :label="t('demo.progress.upload')" show-value />
      <UiProgress :label="t('demo.progress.prepare')" color="secondary" size="sm" />
      <UiProgress :value="100" color="success" size="lg" />
      <UiButton
        class="justify-self-start"
        size="sm"
        variant="outline"
        color="neutral"
        @click="progress = (progress + 12) % 112"
      >
        {{ t('demo.continue') }}
      </UiButton>
    </div>
  </DemoSection>

  <DemoSection name="UiSkeleton">
    <div class="flex max-w-md items-start gap-3" aria-busy="true">
      <UiSkeleton shape="circle" />
      <div class="grid flex-1 gap-2">
        <UiSkeleton :lines="3" />
        <UiSkeleton shape="rect" height="3rem" />
      </div>
    </div>
  </DemoSection>

  <DemoSection name="UiToastProvider">
    <div class="flex flex-wrap gap-2">
      <UiButton
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
      </UiButton>
      <UiButton
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
      </UiButton>
      <UiButton
        variant="outline"
        color="neutral"
        data-testid="toast-persistent"
        @click="toast.add({ title: t('demo.toast.title'), duration: 0 })"
      >
        {{ t('demo.toast.persistent') }}
      </UiButton>
    </div>
  </DemoSection>
</template>
