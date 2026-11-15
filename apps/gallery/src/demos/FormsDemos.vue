<script setup lang="ts" vapor>
import { useForm } from '@formisch/vue'
import * as v from 'valibot'
import { UiButton, UiInput, UiLink } from '@your-scope/ui'
import { UiForm, UiFormErrorSummary, useUiFormField } from '@your-scope/ui/forms'
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
const email = useUiFormField(form, { path: ['email'] })

const save = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 600))
</script>

<template>
  <DemoSection name="UiForm">
    <UiForm :of="form" :submit="save" class="grid max-w-sm gap-3" data-testid="demo-form">
      <template #default="{ isSubmitting }">
        <UiFormErrorSummary />
        <UiInput v-bind="email.props" type="email" autocomplete="email" :label="t('demo.email')" required />
        <UiButton type="submit" class="justify-self-start" :loading="isSubmitting">{{
          t('actions.submit')
        }}</UiButton>
      </template>
    </UiForm>
  </DemoSection>

  <DemoSection name="UiFormErrorSummary">
    <p class="text-vui-sm text-vui-muted">
      {{ t('demo.form.note') }}
      <UiLink href="#/forms">{{ t('nav.forms') }}</UiLink>
    </p>
  </DemoSection>
</template>
