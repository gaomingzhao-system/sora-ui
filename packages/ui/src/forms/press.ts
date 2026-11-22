import { shallowRef } from 'vue'

/**
 * Keeps validation messages from moving a button that is being pressed.
 *
 * A message that appears on blur changes the layout. When the blur is caused
 * by pressing a button (Save, Add row, ...), that button would move between
 * pointer down and pointer up, and the click would be lost or land on
 * something else. So while a pointer is held down, changes to the messages
 * on screen are held back and applied right after the click was dispatched.
 * Formisch's own validation timing is not altered; only the display waits.
 */
let pressed = false
let held = false
let installed = false
let timer: ReturnType<typeof setTimeout> | undefined
/** Bumped when held-back changes may be shown; read by every steady value. */
const released = shallowRef(0)

const flush = (): void => {
  timer = undefined
  pressed = false
  if (!held) return
  held = false
  released.value++
}

const install = (): void => {
  if (installed || typeof document === 'undefined') return
  installed = true
  const options = { capture: true, passive: true } as const
  const release = (): void => {
    if (!held) {
      pressed = false
      return
    }
    clearTimeout(timer)
    // A macrotask, so the click produced by this release is dispatched first.
    timer = setTimeout(flush, 0)
  }
  document.addEventListener(
    'pointerdown',
    () => {
      pressed = true
    },
    options,
  )
  document.addEventListener('pointerup', release, options)
  document.addEventListener('pointercancel', release, options)
}

/**
 * Returns a function that passes values through, except that a *changed*
 * value arriving while a pointer is pressed is replaced by the previous one
 * until the press ends. Call the returned function inside a reactive getter
 * or computed: it tracks the release, so the caller re-evaluates then.
 */
export const steadyWhilePressed = <T>(same: (previous: T, next: T) => boolean): ((next: T) => T) => {
  install()
  let shown: T
  let initialised = false
  return (next) => {
    // Tracked on purpose: re-evaluate when held-back changes are released.
    void released.value
    if (initialised && pressed && !same(shown, next)) {
      if (!held) {
        held = true
        // Safety net: a lost release event must never hold a message back for long.
        timer = setTimeout(flush, 1000)
      }
      return shown
    }
    initialised = true
    shown = next
    return next
  }
}
