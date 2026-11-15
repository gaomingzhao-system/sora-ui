<script setup lang="ts" vapor>
import { UiBadge, UiLink, useUiLocale } from '@your-scope/ui'
import { componentManifest } from '../../../../packages/ui/src/components.manifest.ts'
import ProfileForm from '../examples/ProfileForm.vue'
import ResponsiveWorkspace from '../examples/ResponsiveWorkspace.vue'
import SettingsPanel from '../examples/SettingsPanel.vue'
import { useT } from '../i18n.ts'

const t = useT()
const { formatNumber } = useUiLocale()
</script>

<template>
  <div class="grid gap-8">
    <header class="grid max-w-3xl gap-3">
      <h1 class="text-3xl font-semibold tracking-tight">{{ t('overview.title') }}</h1>
      <p class="text-vui-lg text-vui-muted">{{ t('overview.lead') }}</p>
      <p class="flex flex-wrap items-center gap-3">
        <UiBadge color="secondary" size="lg" data-testid="component-count">
          {{ t('overview.count', { count: formatNumber(componentManifest.length) }) }}
        </UiBadge>
        <UiLink href="#/components">{{ t('nav.components') }}</UiLink>
        <UiLink href="#/accessibility" color="neutral">{{ t('nav.accessibility') }}</UiLink>
      </p>
    </header>

    <section class="grid gap-4" aria-labelledby="examples-title">
      <h2 id="examples-title" class="text-vui-xl font-semibold">{{ t('overview.examples') }}</h2>
      <div class="grid items-start gap-4 lg:grid-cols-2">
        <SettingsPanel />
        <ProfileForm />
      </div>
      <ResponsiveWorkspace />
    </section>
  </div>
</template>
