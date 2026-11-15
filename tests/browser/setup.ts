import { afterEach } from 'vitest'
import { unmountAll } from '../helpers/mount-vapor.ts'

afterEach(() => {
  unmountAll()
  // Native popovers/dialogs live in the top layer; make sure none leaks between tests.
  for (const dialog of document.querySelectorAll('dialog[open]')) (dialog as HTMLDialogElement).close()
  document.body.querySelectorAll('[data-test-root]').forEach((node) => node.remove())
})
