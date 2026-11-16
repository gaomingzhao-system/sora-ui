<script setup lang="ts" vapor>
import { useForm } from '@formisch/vue'
import * as v from 'valibot'
import { SoraButton, SoraInput, SoraLink } from '@your-scope/ui'
import { SoraForm, SoraFormErrorSummary, useSoraFormField } from '@your-scope/ui/forms'
import DemoSection from '../components/DemoSection.vue'
import { useT } from '../i18n.ts'

const t = useT()

const schema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty(() => t('validation.required')),
    v.email(() => t('validation.email')),
  ),
})
const form = useForm({ schema, initialInput: { email: '' } })
const email = useSoraFormField(form, { path: ['email'] })

const save = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 600))
</script>

<template>
  <DemoSection name="SoraForm">
    <SoraForm :of="form" :submit="save" class="grid max-w-sm gap-3" data-testid="demo-form">
      <template #default="{ isSubmitting }">
        <SoraFormErrorSummary />
        <SoraInput v-bind="email.props" type="email" autocomplete="email" :label="t('demo.email')" required />
        <SoraButton type="submit" class="justify-self-start" :loading="isSubmitting">{{
          t('actions.submit')
        }}</SoraButton>
      </template>
    </SoraForm>
  </DemoSection>

  <DemoSection name="SoraFormErrorSummary">
    <p class="text-sora-sm text-sora-muted">
      {{ t('demo.form.note') }}
      <SoraLink href="#/forms">{{ t('nav.forms') }}</SoraLink>
    </p>
  </DemoSection>
</template>
