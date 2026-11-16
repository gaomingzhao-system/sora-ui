/**
 * English messages (source of truth for keys).
 *
 * Flat keys, `{name}` placeholders only: no linked messages, plural pipes or
 * HTML. Counts are phrased number-neutrally so every locale has exactly the
 * same key set (see scripts/check-locales.ts).
 */
const en = {
  'actions.cancel': 'Cancel',
  'actions.close': 'Close',
  'actions.done': 'Done',
  'actions.reset': 'Reset',
  'actions.retry': 'Try again',
  'actions.save': 'Save',
  'actions.submit': 'Submit',

  'alert.dismiss': 'Dismiss alert',
  'avatarGroup.more': 'More: {count}',
  'breadcrumbs.label': 'Breadcrumb',

  'combobox.clear': 'Clear selection',
  'combobox.count': 'Results available: {count}',
  'combobox.empty': 'No results',
  'combobox.error': 'Options could not be loaded.',
  'combobox.loading': 'Loading options',
  'combobox.toggle': 'Show options',

  'dialog.close': 'Close',

  'file.choose': 'Choose file',
  'file.chooseMultiple': 'Choose files',
  'file.count': 'Files selected: {count}',
  'file.list': 'Selected files',
  'file.none': 'No file selected',
  'file.remove': 'Remove {name}',

  'form.errorSummary.title': 'There is a problem',

  'link.external': 'opens in a new tab',

  'number.decrement': 'Decrease',
  'number.increment': 'Increase',
  'number.invalid': 'Enter a valid number.',

  'pagination.current': 'Page {page}, current page',
  'pagination.label': 'Pagination',
  'pagination.next': 'Next page',
  'pagination.page': 'Page {page}',
  'pagination.previous': 'Previous page',
  'pagination.status': 'Page {page} of {total}',

  'password.show': 'Show password',

  'progress.label': 'Progress',
  'select.placeholder': 'Select an option',
  'skeleton.label': 'Loading content',
  'spinner.label': 'Loading',

  'table.empty': 'No data to display',
  'table.loading': 'Loading data',
  'table.region': 'Table, scrollable',
  'table.selectAll': 'Select all rows',
  'table.selectRow': 'Select row {row}',
  'table.sort': 'Sort by {column}',

  'toast.dismiss': 'Dismiss notification',
  'toast.region': 'Notifications',

  'validation.accepted': 'You must accept this to continue.',
  'validation.date': 'Enter a valid date.',
  'validation.email': 'Enter a valid email address.',
  'validation.file': 'Choose a file.',
  'validation.invalid': 'This value is not valid.',
  'validation.max': 'Enter a value of {max} or less.',
  'validation.maxLength': 'Use at most {max} characters.',
  'validation.min': 'Enter a value of {min} or more.',
  'validation.minLength': 'Use at least {min} characters.',
  'validation.number': 'Enter a number.',
  'validation.required': 'This field is required.',
  'validation.url': 'Enter a valid web address.',
} as const

export default en

export type SoraMessageKey = keyof typeof en
export type SoraMessages = Readonly<Record<SoraMessageKey, string>>
