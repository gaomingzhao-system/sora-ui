<script setup lang="ts" vapor>
import { componentCategories, componentManifest } from '../../../../packages/ui/src/components.manifest.ts'
import type { UiComponentCategory } from '../../../../packages/ui/src/components.manifest.ts'
import ActionsDemos from '../demos/ActionsDemos.vue'
import DataDemos from '../demos/DataDemos.vue'
import DisplayDemos from '../demos/DisplayDemos.vue'
import FeedbackDemos from '../demos/FeedbackDemos.vue'
import FormsDemos from '../demos/FormsDemos.vue'
import FoundationDemos from '../demos/FoundationDemos.vue'
import InputsDemos from '../demos/InputsDemos.vue'
import NavigationDemos from '../demos/NavigationDemos.vue'
import OverlaysDemos from '../demos/OverlaysDemos.vue'
import ComponentStates from '../examples/ComponentStates.vue'
import { useT } from '../i18n.ts'

const t = useT()

// One demo file per manifest category; an end-to-end test checks that every
// manifest entry really has a demo section on this page.
const demos = {
  foundation: FoundationDemos,
  actions: ActionsDemos,
  display: DisplayDemos,
  feedback: FeedbackDemos,
  inputs: InputsDemos,
  forms: FormsDemos,
  overlays: OverlaysDemos,
  navigation: NavigationDemos,
  data: DataDemos,
} satisfies Record<UiComponentCategory, unknown>

const namesIn = (category: UiComponentCategory): string[] =>
  componentManifest.filter((entry) => entry.category === category).map((entry) => entry.name)

// The gallery routes on the hash, so in-page links scroll instead of navigating.
function scrollToDemo(name: string): void {
  document.getElementById(`demo-${name}`)?.scrollIntoView()
}
</script>

<template>
  <div class="grid gap-8">
    <header class="grid max-w-3xl gap-2">
      <h1 class="text-2xl font-semibold tracking-tight">{{ t('components.title') }}</h1>
      <p class="text-vui-muted">{{ t('components.lead') }}</p>
    </header>

    <section class="grid gap-3" aria-labelledby="states-title">
      <h2 id="states-title" class="text-vui-xl font-semibold">{{ t('components.states') }}</h2>
      <p class="text-vui-muted">{{ t('components.states.lead') }}</p>
      <ComponentStates />
    </section>

    <section
      v-for="category in componentCategories"
      :key="category"
      class="grid gap-1"
      :aria-labelledby="`category-${category}`"
      :data-category="category"
    >
      <header class="grid gap-2">
        <h2 :id="`category-${category}`" class="text-vui-xl font-semibold">
          {{ t(`category.${category}`) }}
        </h2>
        <!-- In-page links to each component of the category (component names are identifiers, not prose). -->
        <ul class="flex flex-wrap gap-x-3 gap-y-1 font-vui-mono text-vui-xs" dir="ltr">
          <li v-for="name in namesIn(category)" :key="name">
            <a
              class="underline decoration-vui-border-strong underline-offset-4"
              :href="`#demo-${name}`"
              @click.prevent="scrollToDemo(name)"
              >{{ name }}</a
            >
          </li>
        </ul>
      </header>
      <component :is="demos[category]" />
    </section>
  </div>
</template>
