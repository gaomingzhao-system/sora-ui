<script setup lang="ts" vapor>
import { useForm } from '@formisch/vue'
import * as v from 'valibot'
import { ref } from 'vue'
import {
  SoraButton,
  SoraCard,
  SoraDialog,
  SoraInput,
  SoraPagination,
  SoraProvider,
  type SoraButtonProps,
} from '@your-scope/ui'
// A per-component subpath (default export) next to the barrel import.
import SoraBadge from '@your-scope/ui/components/SoraBadge'
import { SoraForm, SoraFormErrorSummary, useSoraFormField } from '@your-scope/ui/forms'
import { createProviderTheme } from '@your-scope/ui/theme'
import { ui } from './i18n'
import LocalizedText from './LocalizedText.vue'

const size = ref<NonNullable<SoraButtonProps['size']>>('md')
const clicks = ref(0)
const open = ref(false)
const page = ref(2)
const saved = ref('')

const schema = v.object({
  email: v.pipe(v.string(), v.nonEmpty('required'), v.email('invalid')),
})
const form = useForm({ schema, initialInput: { email: '' } })
const email = useSoraFormField(form, { path: ['email'] })

const save = async (output: v.InferOutput<typeof schema>): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 50))
  saved.value = output.email
}

const accent = createProviderTheme({ colors: { primary: 'terracotta' } })
</script>

<template>
  <SoraProvider target="document" :locale="ui.locale.value" :translator="ui.translator">
    <main>
      <h1 data-testid="title"><LocalizedText message="app.title" /></h1>

      <div class="row">
        <SoraButton
          :size="size"
          class="app-wide"
          data-testid="consumer-button"
          name="counter"
          aria-describedby="counter-help"
          :disabled="clicks > 5"
          @click="clicks++"
        >
          <LocalizedText message="app.count" :count="clicks" />
        </SoraButton>
        <SoraBadge color="success" data-testid="consumer-badge">{{ clicks }}</SoraBadge>
        <span id="counter-help" hidden>help</span>
        <SoraButton
          v-for="locale in ['en', 'ja', 'ar']"
          :key="locale"
          variant="outline"
          color="neutral"
          size="sm"
          :data-testid="`locale-${locale}`"
          @click="ui.setLocale(locale)"
        >
          {{ locale }}
        </SoraButton>
      </div>

      <SoraCard title="Form" :heading-level="2" data-testid="consumer-card">
        <SoraForm :of="form" :submit="save">
          <SoraFormErrorSummary />
          <SoraInput
            v-bind="email.props"
            type="email"
            autocomplete="email"
            label="Email"
            data-testid="consumer-email"
            required
          />
          <SoraButton type="submit" :loading="form.isSubmitting" data-testid="consumer-submit"
            >Submit</SoraButton
          >
        </SoraForm>
        <template #footer>
          <output data-testid="consumer-saved">{{ saved }}</output>
        </template>
      </SoraCard>

      <SoraProvider v-bind="accent" data-testid="consumer-accent">
        <div class="row">
          <SoraButton data-testid="consumer-open" @click="open = true"
            ><LocalizedText message="app.open"
          /></SoraButton>
          <SoraPagination v-model:page="page" :page-count="5" />
        </div>
      </SoraProvider>

      <SoraDialog v-model:open="open" title="Dialog" data-testid="consumer-dialog">
        <p data-testid="consumer-dialog-body">{{ page }}</p>
        <template #footer="{ close }">
          <SoraButton data-testid="consumer-close" @click="close">OK</SoraButton>
        </template>
      </SoraDialog>
    </main>
  </SoraProvider>
</template>
