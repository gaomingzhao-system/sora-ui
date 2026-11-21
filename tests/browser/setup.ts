// The real library stylesheet: visibility, focus, anchoring and container
// queries behave as they do in an application.
import '@your-scope/ui/styles.css'
import { afterEach, expect } from 'vitest'
import { unmountAll } from '../helpers/mount-vapor.ts'
import { takeUnexpectedConsole } from './console.ts'

afterEach(() => {
  unmountAll()
  // Native popovers/dialogs live in the top layer; make sure none leaks between tests.
  for (const dialog of document.querySelectorAll('dialog[open]')) (dialog as HTMLDialogElement).close()
  document.body.querySelectorAll('[data-test-root]').forEach((node) => node.remove())
  ;(document.activeElement as HTMLElement | null)?.blur?.()
  // Vue warnings and console errors fail the test that produced them (see ./console.ts).
  expect(takeUnexpectedConsole(), 'unexpected console.warn / console.error output').toEqual([])
})
