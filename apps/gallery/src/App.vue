<script setup lang="ts" vapor>
import { ref } from 'vue'
import { SoraProvider, SoraToastProvider, type SoraColorModeSetting, type SoraDensity } from '@your-scope/ui'
import GalleryShell from './GalleryShell.vue'
import { galleryI18n } from './i18n.ts'

// Display settings can be preset from the URL (?theme=dark&locale=ar&density=comfortable),
// which is also how the end-to-end tests select a configuration.
const params = new URLSearchParams(location.search)
const themeParam = params.get('theme')

const colorMode = ref<SoraColorModeSetting>(
  themeParam === 'light' || themeParam === 'dark' || themeParam === 'system' ? themeParam : 'system',
)
const density = ref<SoraDensity>(params.get('density') === 'comfortable' ? 'comfortable' : 'compact')
</script>

<template>
  <!--
    The root provider applies scheme, density, direction and language to
    <html> and hands the petite-vue-i18n translator to every component.
  -->
  <SoraProvider
    target="document"
    :color-mode="colorMode"
    :density="density"
    :locale="galleryI18n.locale.value"
    :translator="galleryI18n.translator"
  >
    <SoraToastProvider>
      <GalleryShell v-model:color-mode="colorMode" v-model:density="density" />
    </SoraToastProvider>
  </SoraProvider>
</template>
