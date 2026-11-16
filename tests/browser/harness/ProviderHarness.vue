<script setup lang="ts" vapor>
import { UiBadge, UiButton, UiCard, UiPagination, UiProvider } from '@your-scope/ui'
import type { UiTranslator } from '@your-scope/ui'
import { createProviderTheme } from '@your-scope/ui/theme'

export interface ProviderState {
  colorMode: 'light' | 'dark' | 'system' | undefined
  density: 'compact' | 'comfortable' | undefined
  radius: 'none' | 'sm' | 'md' | 'lg' | undefined
  motion: 'none' | 'subtle' | 'standard' | undefined
  locale: string | undefined
  dir: 'ltr' | 'rtl' | undefined
  translator: UiTranslator | undefined
  /** Mount the `target="document"` provider. */
  documentProvider: boolean
  page: number
}

const { state } = defineProps<{ state: ProviderState }>()

// A partial ui.config.ts-style object turned into provider props.
const violet = createProviderTheme({
  colors: { primary: 'violet' },
  density: 'comfortable',
  radius: 'lg',
  defaults: { button: { size: 'sm' } },
})
</script>

<template>
  <UiProvider
    data-testid="outer"
    class="from-caller"
    :color-mode="state.colorMode"
    :density="state.density"
    :radius="state.radius"
    :motion="state.motion"
    :locale="state.locale"
    :dir="state.dir"
    :translator="state.translator"
    :defaults="{ button: { size: 'lg', variant: 'outline' }, badge: { color: 'success' } }"
  >
    <UiButton data-testid="outer-button">Outer</UiButton>
    <UiCard data-testid="outer-card" title="Card">Body</UiCard>
    <UiPagination v-model:page="state.page" data-testid="pagination" :page-count="3" />

    <UiProvider
      data-testid="inner"
      as="section"
      color-mode="light"
      :defaults="{ button: { variant: 'soft' } }"
      :theme-vars="{ '--vui-primary': 'rgb(1, 2, 3)' }"
    >
      <UiButton data-testid="inner-button">Inner</UiButton>
      <UiBadge data-testid="inner-badge">Badge</UiBadge>
      <UiCard data-testid="inner-card" title="Card">Body</UiCard>
    </UiProvider>

    <UiProvider data-testid="violet" v-bind="violet">
      <UiButton data-testid="violet-button">Violet</UiButton>
    </UiProvider>
  </UiProvider>

  <UiButton data-testid="plain-button">Plain</UiButton>
  <UiCard data-testid="plain-card" title="Card">Body</UiCard>

  <UiProvider
    v-if="state.documentProvider"
    target="document"
    :color-mode="state.colorMode"
    :density="state.density"
    :locale="state.locale"
    :theme-vars="{ '--vui-test-token': '7px' }"
  >
    <span data-testid="document-child">child</span>
  </UiProvider>
</template>
