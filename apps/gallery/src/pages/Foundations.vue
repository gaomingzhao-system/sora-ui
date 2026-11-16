<script setup lang="ts" vapor>
import { UiBadge, UiButton, UiCard, UiInput, UiProvider, UiSwitch, useUiLocale } from '@your-scope/ui'
import { auditContrast, createProviderTheme, resolveTheme } from '@your-scope/ui/theme'
import { ref } from 'vue'
import uiConfig from '../../../../ui.config.ts'
import { useT } from '../i18n.ts'

const t = useT()
const { formatNumber } = useUiLocale()

// The same resolver that generated the stylesheet, run in the browser.
const checks = auditContrast(resolveTheme(uiConfig)).length

const surfaces = ['canvas', 'surface', 'elevated', 'subtle', 'inverted'] as const
const texts = ['text', 'text-muted', 'text-subtle'] as const
const intents = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const

// Runtime palette override for one subtree: only the named roles change.
const violet = createProviderTheme({ colors: { primary: 'violet', secondary: 'teal' }, radius: 'lg' })
const sample = ref('Ada')
const on = ref(true)
</script>

<template>
  <div class="grid gap-8">
    <header class="grid max-w-3xl gap-2">
      <h1 class="text-2xl font-semibold tracking-tight">{{ t('foundations.title') }}</h1>
      <p class="text-vui-muted">{{ t('foundations.lead') }}</p>
      <p>
        <UiBadge color="success" dot data-testid="contrast-count">{{
          t('foundations.contrast', { count: formatNumber(checks) })
        }}</UiBadge>
      </p>
    </header>

    <section class="grid gap-3" aria-labelledby="surfaces-title">
      <h2 id="surfaces-title" class="text-vui-xl font-semibold">{{ t('foundations.surfaces') }}</h2>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <div
          v-for="name in surfaces"
          :key="name"
          class="g-swatch"
          :style="{
            backgroundColor: `var(--vui-${name})`,
            color: name === 'inverted' ? 'var(--vui-text-inverted)' : 'var(--vui-text)',
          }"
        >
          <code dir="ltr">--vui-{{ name }}</code>
        </div>
      </div>
      <div class="grid gap-2 sm:grid-cols-3">
        <p
          v-for="name in texts"
          :key="name"
          class="g-swatch bg-vui-surface"
          :style="{ color: `var(--vui-${name})` }"
        >
          <span class="text-vui-md">{{ t('foundations.type.sample') }}</span>
          <code dir="ltr">--vui-{{ name }}</code>
        </p>
      </div>
    </section>

    <section class="grid gap-3" aria-labelledby="intents-title">
      <h2 id="intents-title" class="text-vui-xl font-semibold">{{ t('foundations.intents') }}</h2>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        <div v-for="name in intents" :key="name" class="grid gap-1">
          <div
            class="g-swatch border-transparent"
            :style="{ backgroundColor: `var(--vui-${name})`, color: `var(--vui-on-${name})` }"
          >
            <code dir="ltr">{{ name }}</code>
          </div>
          <div
            class="g-swatch min-h-9 border-transparent"
            :style="{ backgroundColor: `var(--vui-${name}-soft)`, color: `var(--vui-${name}-text)` }"
          >
            <code dir="ltr">soft</code>
          </div>
          <div
            class="g-swatch min-h-9 bg-vui-surface"
            :style="{ borderColor: `var(--vui-${name}-border)`, color: `var(--vui-${name}-text)` }"
          >
            <code dir="ltr">border</code>
          </div>
        </div>
      </div>
    </section>

    <section class="grid gap-3" aria-labelledby="type-title">
      <h2 id="type-title" class="text-vui-xl font-semibold">{{ t('foundations.type') }}</h2>
      <UiCard>
        <p
          v-for="size in sizes"
          :key="size"
          class="flex flex-wrap items-baseline gap-x-3"
          :style="{ fontSize: `var(--vui-text-${size})` }"
        >
          <code class="w-24 shrink-0 text-vui-xs text-vui-muted" dir="ltr">text-{{ size }}</code>
          <span>{{ t('foundations.type.sample') }}</span>
        </p>
      </UiCard>
    </section>

    <section class="grid gap-3" aria-labelledby="shape-title">
      <h2 id="shape-title" class="text-vui-xl font-semibold">{{ t('foundations.shape') }}</h2>
      <div class="grid gap-3 sm:grid-cols-3">
        <div
          v-for="radius in ['sm', 'md', 'lg'] as const"
          :key="radius"
          class="g-swatch bg-vui-surface"
          :style="{ borderRadius: `var(--vui-radius-${radius})`, boxShadow: `var(--vui-shadow-${radius})` }"
        >
          <code dir="ltr">radius-{{ radius }} / shadow-{{ radius }}</code>
        </div>
      </div>
    </section>

    <section class="grid gap-3" aria-labelledby="nested-title">
      <h2 id="nested-title" class="text-vui-xl font-semibold">{{ t('foundations.nested') }}</h2>
      <p class="text-vui-muted">{{ t('foundations.nested.lead') }}</p>
      <div class="grid gap-3 md:grid-cols-3">
        <UiProvider color-mode="dark" density="comfortable" data-testid="nested-dark">
          <div class="grid gap-2 rounded-vui-lg bg-vui-canvas p-3 text-vui-text">
            <h3 class="text-vui-sm font-semibold">{{ t('foundations.nested.dark') }}</h3>
            <UiCard :title="t('foundations.sample.title')" :heading-level="4">
              <UiInput v-model="sample" :label="t('demo.name')" />
              <template #footer><UiButton>{{ t('foundations.sample.action') }}</UiButton></template>
            </UiCard>
          </div>
        </UiProvider>
        <UiProvider v-bind="violet" data-testid="nested-custom">
          <div class="grid gap-2 rounded-vui-lg bg-vui-subtle p-3">
            <h3 class="text-vui-sm font-semibold">{{ t('foundations.nested.custom') }}</h3>
            <UiCard :title="t('foundations.sample.title')" :heading-level="4">
              <UiSwitch v-model="on" :label="t('demo.notifications')" />
              <template #footer>
                <UiButton variant="soft" color="secondary">{{ t('demo.cancel') }}</UiButton>
                <UiButton>{{ t('foundations.sample.action') }}</UiButton>
              </template>
            </UiCard>
          </div>
        </UiProvider>
        <UiProvider radius="none" motion="none" data-testid="nested-sharp">
          <div class="grid gap-2 bg-vui-subtle p-3">
            <h3 class="text-vui-sm font-semibold">{{ t('foundations.nested.sharp') }}</h3>
            <UiCard :title="t('foundations.sample.title')" :heading-level="4">
              <p class="text-vui-sm text-vui-muted">{{ t('foundations.sample.body') }}</p>
              <template #footer
                ><UiButton variant="outline" color="neutral">{{
                  t('foundations.sample.action')
                }}</UiButton></template
              >
            </UiCard>
          </div>
        </UiProvider>
      </div>
    </section>
  </div>
</template>
