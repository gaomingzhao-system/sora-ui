import { expect, expectNoAxeViolations, openGallery, test } from '../support.ts'
import type { Locator, Page } from '@playwright/test'

function profile(page: Page): Locator {
  return page.getByTestId('profile-form')
}

/**
 * Fields are located by role and accessible name. (Required fields show a
 * decorative, aria-hidden "*" inside the label element, which the accessible
 * name ignores but a plain label-text match would not.)
 */
const textbox = (form: Locator, name: string): Locator => form.getByRole('textbox', { name, exact: true })
const roleSelect = (form: Locator): Locator => form.getByRole('combobox', { name: 'Role', exact: true })
const terms = (form: Locator): Locator =>
  form.getByRole('checkbox', { name: 'I confirm this information is accurate', exact: true })

async function fillRequired(page: Page, username = 'grace'): Promise<void> {
  const form = profile(page)
  await textbox(form, 'Full name').fill('Grace Hopper')
  await textbox(form, 'Email').fill('grace@example.com')
  await textbox(form, 'Username').fill(username)
  await roleSelect(form).selectOption('engineering')
  await terms(form).check()
}

test('submitting an empty form explains every problem and focuses the first one', async ({ page }) => {
  await openGallery(page, 'forms')
  const form = profile(page)
  // Nothing is flagged before the user has done anything.
  await expect(form.locator('[aria-invalid="true"]')).toHaveCount(0)
  await expect(form.getByRole('group', { name: 'There is a problem' })).toHaveCount(0)

  await form.getByTestId('profile-submit').click()
  const summary = form.getByRole('group', { name: 'There is a problem' })
  await expect(summary).toBeVisible()
  await expect(textbox(form, 'Full name')).toBeFocused()
  await expect(textbox(form, 'Full name')).toHaveAttribute('aria-invalid', 'true')
  await expect(textbox(form, 'Full name')).toHaveAccessibleDescription('This field is required.')
  // One line per field, named by the field's own label; an empty email is "required", not also "invalid".
  await expect(summary.getByRole('link')).toHaveText([
    'Full name: This field is required.',
    'Email: This field is required.',
    'Username: This field is required.',
    'Role: This field is required.',
    'I confirm this information is accurate: You must accept this to continue.',
  ])
  await expect(page.getByTestId('profile-output')).toHaveCount(0)
  await expectNoAxeViolations(page)

  // A summary link moves focus to its field.
  await summary.getByRole('link', { name: /^Role/ }).click()
  await expect(roleSelect(form)).toBeFocused()
})

test('messages appear when a field is left, then follow typing; untouched fields stay quiet', async ({
  page,
}) => {
  await openGallery(page, 'forms')
  const form = profile(page)
  const email = textbox(form, 'Email')
  await email.fill('not-an-email')
  await expect(email).not.toHaveAttribute('aria-invalid', 'true')
  await email.blur()
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).toHaveAccessibleDescription(/Enter a valid email address\./)
  await expect(textbox(form, 'Full name')).not.toHaveAttribute('aria-invalid', 'true')
  await expect(roleSelect(form)).not.toHaveAttribute('aria-invalid', 'true')

  await email.fill('grace@example.com')
  await expect(email).not.toHaveAttribute('aria-invalid', 'true')
})

test('asynchronous and conditional rules are validated', async ({ page }) => {
  await openGallery(page, 'forms')
  const form = profile(page)
  // The username check asks a (simulated) server.
  const username = textbox(form, 'Username')
  await username.fill('Ada')
  await username.blur()
  await expect(username).toHaveAccessibleDescription('This username is already taken.')
  await username.fill('grace')
  await expect(username).not.toHaveAttribute('aria-invalid', 'true')

  // The phone number exists, and is required, only while "Phone" is the chosen contact method.
  await expect(textbox(form, 'Phone number')).toHaveCount(0)
  await form.getByRole('radio', { name: 'Phone' }).check()
  const phone = textbox(form, 'Phone number')
  await expect(phone).toBeVisible()
  await fillRequired(page)
  await form.getByTestId('profile-submit').click()
  await expect(phone).toHaveAttribute('aria-invalid', 'true')
  await expect(form.getByRole('group', { name: 'There is a problem' }).getByRole('link')).toHaveText([
    'Phone number: This field is required.',
  ])
  await phone.fill('+81 3 1234 5678')
  await form.getByTestId('profile-submit').click()
  await expect(page.getByTestId('profile-output')).toContainText('"phone": "+81 3 1234 5678"')
})

test('a valid form is submitted once, stays busy while saving, and reports the typed output', async ({
  page,
}) => {
  await openGallery(page, 'forms')
  const form = profile(page)
  await fillRequired(page)
  await form.getByLabel('Years of experience').fill('12')
  await form.getByLabel('Start date').fill('2026-04-01')
  await form.getByRole('checkbox', { name: 'Security alerts' }).check()
  await form.getByTestId('add-link').click()
  await form.getByLabel('Link 1', { exact: true }).fill('https://example.com/grace')

  const submit = form.getByTestId('profile-submit')
  await submit.click()
  // Duplicate activations while the awaited callback is pending are ignored.
  await expect(submit).toHaveAttribute('aria-busy', 'true')
  await submit.click({ force: true })
  await page.keyboard.press('Enter')
  await expect(form.locator('form')).toHaveAttribute('aria-busy', 'true')

  const output = page.getByTestId('profile-output')
  await expect(output).toBeVisible()
  await expect(submit).not.toHaveAttribute('aria-busy', 'true')
  const saved = JSON.parse((await output.textContent()) ?? '{}') as Record<string, unknown>
  expect(saved).toMatchObject({
    name: 'Grace Hopper',
    email: 'grace@example.com',
    username: 'grace',
    role: 'engineering',
    experience: 12,
    start: '2026-04-01',
    contact: { method: 'email' },
    topics: ['product', 'security'],
    links: ['https://example.com/grace'],
    terms: true,
  })
  // Exactly one submission: one confirmation.
  const toasts = page.getByRole('region', { name: 'Notifications' }).locator('.vui-toast')
  await expect(toasts).toHaveCount(1)
  await expect(toasts).toContainText('Profile saved')
})

test('array rows validate individually and can be removed', async ({ page }) => {
  await openGallery(page, 'forms')
  const form = profile(page)
  await fillRequired(page)
  await form.getByTestId('add-link').click()
  await form.getByTestId('add-link').click()
  await form.getByLabel('Link 1', { exact: true }).fill('https://example.com/one')
  await form.getByLabel('Link 2', { exact: true }).fill('not a url')
  await form.getByTestId('profile-submit').click()
  await expect(form.getByLabel('Link 2', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await expect(form.getByRole('group', { name: 'There is a problem' }).getByRole('link')).toHaveText([
    'Link 2: Enter a valid web address.',
  ])

  await form.getByRole('button', { name: 'Remove link 2' }).click()
  await expect(form.getByLabel('Link 2', { exact: true })).toHaveCount(0)
  await expect(form.getByLabel('Link 1', { exact: true })).toHaveValue('https://example.com/one')
  await form.getByTestId('profile-submit').click()
  await expect(page.getByTestId('profile-output')).toContainText('https://example.com/one')
})

test('a server error becomes a form-level alert and the form can be retried', async ({ page }) => {
  await openGallery(page, 'forms')
  const form = profile(page)
  await fillRequired(page)
  await form.getByTestId('simulate-error').check()
  await form.getByTestId('profile-submit').click()
  const alert = form.getByRole('alert').filter({ hasText: 'There is a problem' })
  await expect(alert).toContainText('The server rejected the request. Please try again.')
  await expect(page.getByTestId('profile-output')).toHaveCount(0)
  await expect(textbox(form, 'Full name')).toHaveValue('Grace Hopper')

  await form.getByTestId('simulate-error').uncheck()
  await form.getByTestId('profile-submit').click()
  await expect(page.getByTestId('profile-output')).toBeVisible()
  await expect(alert).toHaveCount(0)
})

test('reset restores the initial values and clears every message', async ({ page }) => {
  await openGallery(page, 'forms')
  const form = profile(page)
  await textbox(form, 'Full name').fill('Someone')
  await form.getByTestId('add-link').click()
  await form.getByTestId('profile-submit').click()
  await expect(form.getByRole('group', { name: 'There is a problem' })).toBeVisible()

  await form.getByRole('button', { name: 'Reset' }).click()
  await expect(textbox(form, 'Full name')).toHaveValue('')
  await expect(form.getByLabel('Link 1', { exact: true })).toHaveCount(0)
  await expect(form.locator('[aria-invalid="true"]')).toHaveCount(0)
  await expect(form.getByRole('group', { name: 'There is a problem' })).toHaveCount(0)
  await expect(form.getByRole('checkbox', { name: 'Product updates' })).toBeChecked()
})

test('validation messages switch language with the locale, keeping the values', async ({ page }) => {
  await openGallery(page, 'forms')
  const form = profile(page)
  await textbox(form, 'Full name').fill('Grace Hopper')
  await form.getByTestId('profile-submit').click()
  const summary = form.getByRole('group', { name: 'There is a problem' })
  await expect(summary.getByRole('link').first()).toHaveText('Email: This field is required.')

  await page.getByTestId('settings-trigger').click()
  await page.getByTestId('locale-select').selectOption('ja')
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
  await page.keyboard.press('Escape')
  // Still the same errors, now in Japanese, and the typed value is untouched.
  await expect(form.locator('.vui-error-summary a').first()).not.toHaveText('Email: This field is required.')
  await expect(form.locator('.vui-error-summary a').first()).toContainText('必須')
  await expect(form.locator('.vui-error-summary a')).toHaveCount(4)
  await expect(form.locator('input').first()).toHaveValue('Grace Hopper')
})

test('a file input hands real files to the form', async ({ page }) => {
  await openGallery(page, 'forms')
  const form = profile(page)
  await fillRequired(page)
  await form.locator('input[type="file"]').setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    ),
  })
  await expect(form.getByText('avatar.png').first()).toBeVisible()
  await form.getByTestId('profile-submit').click()
  await expect(page.getByTestId('profile-output')).toContainText('"avatar.png"')
})
