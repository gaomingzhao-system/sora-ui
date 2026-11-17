<script setup lang="ts" vapor>
import { SoraBadge, SoraButton, SoraCard, SoraPagination, SoraProvider } from '@your-scope/ui'
import type { SoraTranslator } from '@your-scope/ui'
import { createProviderTheme } from '@your-scope/ui/theme'

export interface ProviderState {
  colorMode: 'light' | 'dark' | 'system' | undefined
  density: 'compact' | 'comfortable' | undefined
  radius: 'none' | 'sm' | 'md' | 'lg' | undefined
  motion: 'none' | 'subtle' | 'standard' | undefined
  locale: string | undefined
  dir: 'ltr' | 'rtl' | undefined
  translator: SoraTranslator | undefined
  /** Mount the `target="document"` provider. */
  documentProvider: boolean
  page: number
}

const { state } = defineProps<{ state: ProviderState }>()

// A partial sora.config.ts-style object turned into provider props.
const violet = createProviderTheme({
  colors: { primary: 'violet' },
  density: 'comfortable',
  radius: 'lg',
  defaults: { button: { size: 'sm' } },
})
</script>

<template>
  <SoraProvider
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
    <SoraButton data-testid="outer-button">Outer</SoraButton>
    <SoraCard data-testid="outer-card" title="Card">Body</SoraCard>
    <SoraPagination v-model:page="state.page" data-testid="pagination" :page-count="3" />

    <SoraProvider
      data-testid="inner"
      as="section"
      color-mode="light"
      :defaults="{ button: { variant: 'soft' } }"
      :theme-vars="{ '--sora-primary': 'rgb(1, 2, 3)' }"
    >
      <SoraButton data-testid="inner-button">Inner</SoraButton>
      <SoraBadge data-testid="inner-badge">Badge</SoraBadge>
      <SoraCard data-testid="inner-card" title="Card">Body</SoraCard>
    </SoraProvider>

    <SoraProvider data-testid="violet" v-bind="violet">
      <SoraButton data-testid="violet-button">Violet</SoraButton>
    </SoraProvider>
  </SoraProvider>

  <SoraButton data-testid="plain-button">Plain</SoraButton>
  <SoraCard data-testid="plain-card" title="Card">Body</SoraCard>

  <SoraProvider
    v-if="state.documentProvider"
    target="document"
    :color-mode="state.colorMode"
    :density="state.density"
    :locale="state.locale"
    :theme-vars="{ '--sora-test-token': '7px' }"
  >
    <span data-testid="document-child">child</span>
  </SoraProvider>
</template>
