<script setup lang="ts" vapor>
import ProfileForm from '../examples/ProfileForm.vue'
import { useT } from '../i18n.ts'

const t = useT()
</script>

<template>
  <div class="grid gap-6">
    <header class="grid max-w-3xl gap-2">
      <h1 class="text-2xl font-semibold tracking-tight">{{ t('forms.title') }}</h1>
      <p class="text-vui-muted">{{ t('forms.lead') }}</p>
    </header>
    <div class="max-w-3xl">
      <ProfileForm :heading-level="2" />
    </div>
  </div>
</template>
