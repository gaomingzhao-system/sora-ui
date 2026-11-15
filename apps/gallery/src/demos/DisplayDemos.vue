<script setup lang="ts" vapor>
import {
  UiAvatar,
  UiAvatarGroup,
  UiBadge,
  UiButton,
  UiCard,
  UiEmptyState,
  UiKbd,
  UiSeparator,
} from '@your-scope/ui'
import DemoSection from '../components/DemoSection.vue'
import { useT } from '../i18n.ts'

const t = useT()
const team = [
  { name: 'Ada Lovelace' },
  { name: 'Grace Hopper' },
  { name: '山田 太郎' },
  { name: 'ليلى حسن' },
  { name: 'Alan Turing' },
  { name: 'Barbara Liskov' },
]
const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
</script>

<template>
  <DemoSection name="UiCard">
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <UiCard
        v-for="variant in ['outline', 'soft', 'elevated', 'plain'] as const"
        :key="variant"
        :variant="variant"
        :title="t('demo.card.title')"
      >
        <p>{{ t('demo.card.body') }}</p>
        <template #actions><UiBadge color="success" dot>{{ t('demo.badge.active') }}</UiBadge></template>
        <template #footer>
          <UiButton variant="ghost" color="neutral" size="sm">{{ t('demo.cancel') }}</UiButton>
          <UiButton size="sm">{{ t('demo.save') }}</UiButton>
        </template>
      </UiCard>
    </div>
  </DemoSection>

  <DemoSection name="UiBadge">
    <div class="grid gap-2">
      <div
        v-for="variant in ['soft', 'solid', 'outline'] as const"
        :key="variant"
        class="flex flex-wrap items-center gap-2"
      >
        <UiBadge v-for="color in colors" :key="color" :variant="variant" :color="color">{{
          t('demo.badge.new')
        }}</UiBadge>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UiBadge size="sm">{{ t('demo.badge.beta') }}</UiBadge>
        <UiBadge color="success" dot>{{ t('demo.badge.active') }}</UiBadge>
        <UiBadge size="lg" color="error" dot>{{ t('demo.badge.failed') }}</UiBadge>
      </div>
    </div>
  </DemoSection>

  <DemoSection name="UiAvatar">
    <div class="flex flex-wrap items-center gap-3">
      <UiAvatar name="Ada Lovelace" size="sm" />
      <UiAvatar name="Grace Hopper" />
      <UiAvatar name="山田 太郎" size="lg" />
      <UiAvatar name="Alan Turing" shape="square" />
      <UiAvatar name="Broken image" src="/does-not-exist.png" />
      <UiAvatar />
    </div>
  </DemoSection>

  <DemoSection name="UiAvatarGroup">
    <UiAvatarGroup :items="team" :max="4" :label="t('demo.team')" />
  </DemoSection>

  <DemoSection name="UiSeparator">
    <div class="grid gap-3">
      <UiSeparator />
      <UiSeparator>{{ t('demo.or') }}</UiSeparator>
      <div class="flex h-6 items-center gap-3 text-vui-sm">
        <span>{{ t('demo.name') }}</span>
        <UiSeparator orientation="vertical" :decorative="false" />
        <span>{{ t('demo.email') }}</span>
      </div>
    </div>
  </DemoSection>

  <DemoSection name="UiKbd">
    <p class="flex flex-wrap items-center gap-3 text-vui-sm">
      <span>{{ t('demo.kbd.palette') }}</span>
      <UiKbd :keys="['Ctrl', 'K']" />
      <UiKbd>Esc</UiKbd>
      <UiKbd size="sm">Tab</UiKbd>
      <UiKbd size="lg" :keys="['Shift', 'Alt', 'F']" />
    </p>
  </DemoSection>

  <DemoSection name="UiEmptyState">
    <UiCard variant="soft">
      <UiEmptyState :title="t('demo.empty.title')" :description="t('demo.empty.body')">
        <template #actions>
          <UiButton>{{ t('demo.empty.action') }}</UiButton>
        </template>
      </UiEmptyState>
    </UiCard>
  </DemoSection>
</template>
