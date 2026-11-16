# Forms

`@your-scope/ui/forms` connects the controls to [Formisch](https://formisch.dev) and Valibot. It is an
optional entry: install the peers only if you use it.

```bash
pnpm add @formisch/vue valibot
```

Only Formisch's composables and methods are used. Its own `Form` and `Field` components are
virtual-DOM SFCs and are not rendered by this library.

## A complete form

```vue
<script setup lang="ts" vapor>
import { useForm } from '@formisch/vue'
import * as v from 'valibot'
import { SoraButton, SoraCheckbox, SoraInput } from '@your-scope/ui'
import { SoraForm, SoraFormErrorSummary, useSoraFormField } from '@your-scope/ui/forms'

const schema = v.object({
  email: v.pipe(v.string(), v.nonEmpty('Enter your email.'), v.email('Enter a valid email address.')),
  terms: v.literal(true, 'You must accept the terms.'),
})

const form = useForm({ schema, initialInput: { email: '' }, validate: 'blur', revalidate: 'input' })
const email = useSoraFormField(form, { path: ['email'] })
const terms = useSoraFormField(form, { path: ['terms'] })

// `output` is the validated, typed output of the schema. The form waits for this promise.
async function save(output: v.InferOutput<typeof schema>): Promise<void> {
  await api.saveProfile(output)
}
</script>

<template>
  <SoraForm :of="form" :submit="save">
    <template #default="{ isSubmitting }">
      <SoraFormErrorSummary />
      <SoraInput v-bind="email.props" type="email" label="Email" autocomplete="email" required />
      <SoraCheckbox v-bind="terms.props" label="I accept the terms" required />
      <SoraButton type="submit" :loading="isSubmitting">Save</SoraButton>
    </template>
  </SoraForm>
</template>
```

## `useSoraFormField(form, config, options?)`

Wraps Formisch's `useField()` and returns `{ field, props }`. `v-bind="x.props"` on any control of the
library supplies four things:

| Binding               | What it is                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `modelValue`          | the field's input                                                                                                  |
| `onUpdate:modelValue` | writes the field; a control's `null` ("no value") becomes Formisch's `undefined`                                   |
| `controlAttrs`        | Formisch's element props, routed to the **native** control: `name`, the element `ref`, focus/change/blur listeners |
| `error`               | the messages to show                                                                                               |

Formisch therefore registers the real `<input>`, `<select>` or `<textarea>` (never a component
instance), which is what makes focusing the first invalid field work. Radio and checkbox groups
register every native option under the one field name.

The path may be a getter, so a row of an array field follows its item when earlier rows are removed:

```ts
const link = useSoraFormField(form, () => ({ path: ['links', index] as const }))
```

### When messages appear

Formisch validates the whole form at once and assigns errors to **every** field, so with
`validate: 'blur'` leaving the first field would mark all the fields the user has not reached yet.
`useSoraFormField` therefore decides what is shown:

| Option   | Values                              | Meaning                                                                                                                                                        |
| -------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reveal` | `'visited'` (default) \| `'always'` | Show a field's messages once that field was left (blur) or the form was submitted. `always` shows whatever the store holds (use it with `validate: 'initial'`) |
| `errors` | `'first'` (default) \| `'all'`      | A Valibot pipe reports every failed rule (an empty email is both "required" and "not an email"); `first` shows the one to fix next                             |

`field.errors` always holds the complete, ungated list.

One more detail protects pointer users: a message that appears on blur changes the layout. When the
blur is caused by pressing a button, the button would move between pointer down and pointer up and
the click would be lost. While a pointer is held down, message changes are held back and applied
right after the click. Formisch's validation timing is not altered; only the display waits.

## `SoraForm`

Renders a native `<form novalidate>`.

| Prop     | Type                                 | Description                                   |
| -------- | ------------------------------------ | --------------------------------------------- |
| `of`     | `FormStore`                          | the store returned by `useForm()`             |
| `submit` | `(output, event) => void \| Promise` | called with the validated output; **awaited** |

`submit` is a prop rather than an event because an emitted event cannot be awaited. While the promise
is pending the form is `aria-busy`, the slot prop `isSubmitting` is true and further submissions are
ignored. That guard sits on the form's single submit path, so it covers the submit button, Enter in
a field and `requestSubmit()` alike.

| Event       | When                                                                   |
| ----------- | ---------------------------------------------------------------------- |
| `submitted` | the `submit` callback resolved                                         |
| `invalid`   | validation failed on submit (focus is on the first invalid field)      |
| `error`     | the `submit` callback rejected; its message becomes a form-level error |

Slot props: `isSubmitting`, `isValid`, `isDirty`. Exposed: `requestSubmit()`, `reset()` and `element`.
A `type="reset"` button resets the Formisch store (a native reset would only restore DOM values).

When the active locale changes, `SoraForm` regenerates the messages that are currently visible in the
new language. Values, touched and dirty state are untouched. This works when schema messages are
functions (`v.nonEmpty(() => t('validation.required'))`), which is how the gallery writes them.

## `SoraFormErrorSummary`

Lists the errors of the surrounding `SoraForm` (or of `of`): nested and array fields included, one line
per field, as links that focus the field. Each line is named after the field's own `<label>`, or the
`<legend>` for radio and checkbox groups. It appears after a submission attempt (`reveal="always"`
shows it whenever the store holds an error) and lists the first message per field (`errors="all"`
lists every one).

It is a labelled group. Focus is already on the first invalid field, which announces its own error,
so the summary is not a live region, except for form-level errors (a rejected `submit`), which no
field could announce: then it is `role="alert"`.

## What the gallery demonstrates

[`apps/gallery/src/examples/ProfileForm.vue`](../apps/gallery/src/examples/ProfileForm.vue): required
and optional fields, a nested object, a conditional field, an array field with add and remove,
checkbox, radio and select controls, numeric, date and file inputs, an asynchronous rule, a
cross-field rule, a simulated server error, reset, and duplicate-submit protection. The E2E suite
drives all of it.
