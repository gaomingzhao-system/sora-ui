<script setup lang="ts" vapor>
import { useForm } from '@formisch/vue'
import * as v from 'valibot'
import { ref } from 'vue'
import { UiButton, UiCard, UiDialog, UiInput, UiPagination, UiProvider } from '@your-scope/ui'
import type { UiButtonProps } from '@your-scope/ui'
// A per-component subpath (default export) next to the barrel import.
import UiBadge from '@your-scope/ui/components/UiBadge'
import { UiForm, UiFormErrorSummary, useUiFormField } from '@your-scope/ui/forms'
import { createProviderTheme } from '@your-scope/ui/theme'
import { ui } from './i18n'
import LocalizedText from './LocalizedText.vue'

const size = ref<NonNullable<UiButtonProps['size']>>('md')
const clicks = ref(0)
const open = ref(false)
const page = ref(2)
const saved = ref('')

const schema = v.object({
  email: v.pipe(v.string(), v.nonEmpty('required'), v.email('invalid')),
})
const form = useForm({ schema, initialInput: { email: '' } })
const email = useUiFormField(form, { path: ['email'] })

async function save(output: v.InferOutput<typeof schema>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 50))
  saved.value = output.email
}

const accent = createProviderTheme({ colors: { primary: 'terracotta' } })
</script>

<template>
  <UiProvider target="document" :locale="ui.locale.value" :translator="ui.translator">
    <main>
      <h1 data-testid="title"><LocalizedText message="app.title" /></h1>

      <div class="row">
        <UiButton
          :size="size"
          class="app-wide"
          data-testid="consumer-button"
          name="counter"
          aria-describedby="counter-help"
          :disabled="clicks > 5"
          @click="clicks++"
        >
          <LocalizedText message="app.count" :count="clicks" />
        </UiButton>
        <UiBadge color="success" data-testid="consumer-badge">{{ clicks }}</UiBadge>
        <span id="counter-help" hidden>help</span>
        <UiButton
          v-for="locale in ['en', 'ja', 'ar']"
          :key="locale"
          variant="outline"
          color="neutral"
          size="sm"
          :data-testid="`locale-${locale}`"
          @click="ui.setLocale(locale)"
        >
          {{ locale }}
        </UiButton>
      </div>

      <UiCard title="Form" :heading-level="2" data-testid="consumer-card">
        <UiForm :of="form" :submit="save">
          <UiFormErrorSummary />
          <UiInput
            v-bind="email.props"
            type="email"
            autocomplete="email"
            label="Email"
            data-testid="consumer-email"
            required
          />
          <UiButton type="submit" :loading="form.isSubmitting" data-testid="consumer-submit">Submit</UiButton>
        </UiForm>
        <template #footer>
          <output data-testid="consumer-saved">{{ saved }}</output>
        </template>
      </UiCard>

      <UiProvider v-bind="accent" data-testid="consumer-accent">
        <div class="row">
          <UiButton data-testid="consumer-open" @click="open = true"
            ><LocalizedText message="app.open"
          /></UiButton>
          <UiPagination v-model:page="page" :page-count="5" />
        </div>
      </UiProvider>

      <UiDialog v-model:open="open" title="Dialog" data-testid="consumer-dialog">
        <p data-testid="consumer-dialog-body">{{ page }}</p>
        <template #footer="{ close }">
          <UiButton data-testid="consumer-close" @click="close">OK</UiButton>
        </template>
      </UiDialog>
    </main>
  </UiProvider>
</template>
