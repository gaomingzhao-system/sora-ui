<script setup lang="ts" vapor>
import {
  SoraAvatar,
  SoraAvatarGroup,
  SoraBadge,
  SoraButton,
  SoraCard,
  SoraEmptyState,
  SoraKbd,
  SoraSeparator,
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
  <DemoSection name="SoraCard">
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <SoraCard
        v-for="variant in ['outline', 'soft', 'elevated', 'plain'] as const"
        :key="variant"
        :variant="variant"
        :title="t('demo.card.title')"
        :heading-level="4"
      >
        <p>{{ t('demo.card.body') }}</p>
        <template #actions><SoraBadge color="success" dot>{{ t('demo.badge.active') }}</SoraBadge></template>
        <template #footer>
          <SoraButton variant="ghost" color="neutral" size="sm">{{ t('demo.cancel') }}</SoraButton>
          <SoraButton size="sm">{{ t('demo.save') }}</SoraButton>
        </template>
      </SoraCard>
    </div>
  </DemoSection>

  <DemoSection name="SoraBadge">
    <div class="grid gap-2">
      <div
        v-for="variant in ['soft', 'solid', 'outline'] as const"
        :key="variant"
        class="flex flex-wrap items-center gap-2"
      >
        <SoraBadge v-for="color in colors" :key="color" :variant="variant" :color="color">{{
          t('demo.badge.new')
        }}</SoraBadge>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <SoraBadge size="sm">{{ t('demo.badge.beta') }}</SoraBadge>
        <SoraBadge color="success" dot>{{ t('demo.badge.active') }}</SoraBadge>
        <SoraBadge size="lg" color="error" dot>{{ t('demo.badge.failed') }}</SoraBadge>
      </div>
    </div>
  </DemoSection>

  <DemoSection name="SoraAvatar">
    <div class="flex flex-wrap items-center gap-3">
      <SoraAvatar name="Ada Lovelace" size="sm" />
      <SoraAvatar name="Grace Hopper" />
      <SoraAvatar name="山田 太郎" size="lg" />
      <SoraAvatar name="Alan Turing" shape="square" />
      <!-- A source that cannot be decoded: the avatar falls back to initials (no network request involved). -->
      <SoraAvatar name="Broken image" src="data:image/png;base64,AAAA" />
      <SoraAvatar />
    </div>
  </DemoSection>

  <DemoSection name="SoraAvatarGroup">
    <SoraAvatarGroup :items="team" :max="4" :label="t('demo.team')" />
  </DemoSection>

  <DemoSection name="SoraSeparator">
    <div class="grid gap-3">
      <SoraSeparator />
      <SoraSeparator>{{ t('demo.or') }}</SoraSeparator>
      <div class="flex h-6 items-center gap-3 text-sora-sm">
        <span>{{ t('demo.name') }}</span>
        <SoraSeparator orientation="vertical" :decorative="false" />
        <span>{{ t('demo.email') }}</span>
      </div>
    </div>
  </DemoSection>

  <DemoSection name="SoraKbd">
    <p class="flex flex-wrap items-center gap-3 text-sora-sm">
      <span>{{ t('demo.kbd.palette') }}</span>
      <SoraKbd :keys="['Ctrl', 'K']" />
      <SoraKbd>Esc</SoraKbd>
      <SoraKbd size="sm">Tab</SoraKbd>
      <SoraKbd size="lg" :keys="['Shift', 'Alt', 'F']" />
    </p>
  </DemoSection>

  <DemoSection name="SoraEmptyState">
    <SoraCard variant="soft">
      <SoraEmptyState :title="t('demo.empty.title')" :description="t('demo.empty.body')" :heading-level="4">
        <template #actions>
          <SoraButton>{{ t('demo.empty.action') }}</SoraButton>
        </template>
      </SoraEmptyState>
    </SoraCard>
  </DemoSection>
</template>
