<script setup lang="ts" vapor>
import { computed } from 'vue'
import {
  UiButton,
  UiButtonGroup,
  UiIcon,
  UiPopover,
  UiSelect,
  iconMonitor,
  iconMoon,
  iconSun,
} from '@your-scope/ui'
import type { UiColorModeSetting, UiDensity } from '@your-scope/ui'
import { LOCALES, galleryI18n, isGalleryLocale, useT } from './i18n.ts'
import type { GalleryLocale } from './i18n.ts'
import Accessibility from './pages/Accessibility.vue'
import Components from './pages/Components.vue'
import Forms from './pages/Forms.vue'
import Foundations from './pages/Foundations.vue'
import Overview from './pages/Overview.vue'
import { PAGES, useRoute } from './router.ts'

const colorMode = defineModel<UiColorModeSetting>('colorMode', { required: true })
const density = defineModel<UiDensity>('density', { required: true })

const t = useT()
const { page, href } = useRoute()

const pages = {
  overview: Overview,
  foundations: Foundations,
  components: Components,
  forms: Forms,
  accessibility: Accessibility,
}
const current = computed(() => pages[page.value])

const themes = [
  { value: 'light', icon: iconSun, label: 'app.theme.light' },
  { value: 'dark', icon: iconMoon, label: 'app.theme.dark' },
  { value: 'system', icon: iconMonitor, label: 'app.theme.system' },
] as const

const densities = computed(() => [
  { value: 'compact' as const, label: t('app.density.compact') },
  { value: 'comfortable' as const, label: t('app.density.comfortable') },
])

async function setLocale(value: GalleryLocale | null): Promise<void> {
  if (value && isGalleryLocale(value)) await galleryI18n.setLocale(value)
}
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-10 focus:rounded-vui focus:bg-vui-elevated focus:px-3 focus:py-2"
    >
      {{ t('app.skip') }}
    </a>

    <header class="sticky top-0 z-10 border-b border-vui-border bg-vui-canvas/95 backdrop-blur-sm">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
        <p class="flex items-baseline gap-2 font-semibold">
          <span class="font-vui-display text-vui-lg">{{ t('app.title') }}</span>
          <span class="text-vui-sm font-normal text-vui-muted max-sm:hidden">{{ t('app.subtitle') }}</span>
        </p>

        <UiPopover
          class="ms-auto"
          :trigger-label="t('app.settings')"
          :title="t('app.settings')"
          placement="bottom-end"
          size="sm"
          data-testid="settings-trigger"
        >
          <div class="grid w-64 max-w-full gap-3">
            <div class="grid gap-1.5">
              <span id="g-theme-label" class="text-vui-sm font-medium">{{ t('app.theme') }}</span>
              <UiButtonGroup
                attached
                aria-labelledby="g-theme-label"
                size="sm"
                variant="outline"
                color="neutral"
              >
                <UiButton
                  v-for="theme in themes"
                  :key="theme.value"
                  block
                  :variant="colorMode === theme.value ? 'solid' : 'outline'"
                  :aria-pressed="colorMode === theme.value ? 'true' : 'false'"
                  :data-testid="`theme-${theme.value}`"
                  @click="colorMode = theme.value"
                >
                  <template #leading><UiIcon :icon="theme.icon" /></template>
                  {{ t(theme.label) }}
                </UiButton>
              </UiButtonGroup>
            </div>
            <UiSelect
              :model-value="galleryI18n.locale.value as GalleryLocale"
              :options="LOCALES"
              :label="t('app.locale')"
              size="sm"
              data-testid="locale-select"
              @update:model-value="setLocale"
            />
            <UiSelect
              :model-value="density"
              :options="densities"
              :label="t('app.density')"
              size="sm"
              data-testid="density-select"
              @update:model-value="(value) => value && (density = value)"
            />
          </div>
        </UiPopover>

        <!-- Site navigation is a list of links in a nav landmark: not tabs, not a menu. -->
        <nav class="order-last w-full overflow-x-auto" :aria-label="t('app.nav')">
          <ul class="flex gap-1">
            <li v-for="name in PAGES" :key="name">
              <a class="g-nav-link" :href="href(name)" :aria-current="page === name ? 'page' : undefined">
                {{ t(`nav.${name}`) }}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>

    <main id="main" class="mx-auto w-full max-w-6xl flex-1 px-4 py-6" tabindex="-1">
      <component :is="current" />
    </main>
  </div>
</template>
