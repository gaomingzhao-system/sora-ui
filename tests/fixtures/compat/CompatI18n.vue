<script setup lang="ts" vapor>
// 7. petite-vue-i18n locale switching that updates rendered labels.
import type { I18n } from 'petite-vue-i18n'

const props = defineProps<{ i18n: I18n<Record<string, Record<string, string>>, {}, {}, string, false> }>()
const { t, locale } = props.i18n.global
</script>

<template>
  <div>
    <button type="button" data-testid="i18n-label" :aria-label="t('dialog.close')">
      {{ t('actions.save') }}
    </button>
    <output data-testid="i18n-locale">{{ locale }}</output>
  </div>
</template>
