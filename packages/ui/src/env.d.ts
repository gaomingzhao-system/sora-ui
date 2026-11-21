/**
 * Template typing for platform attributes that Vue 3.6.0-rc.15's DOM types
 * do not list yet. This file only affects type-checking of this package's
 * own templates: it is not reachable from any entry, so it is not part of
 * the published declarations.
 */
import 'vue'

declare module 'vue' {
  interface HTMLAttributes {
    /** Popover API. */
    popover?: 'auto' | 'manual' | 'hint' | '' | undefined
    /** A global attribute: the element a dialog or popover focuses when it opens. */
    autofocus?: boolean | undefined
  }
  interface ButtonHTMLAttributes {
    popovertarget?: string | undefined
    popovertargetaction?: 'toggle' | 'show' | 'hide' | undefined
  }
  interface InputHTMLAttributes {
    /** Safari renders `<input type="checkbox" switch>` as a native switch. */
    switch?: boolean | undefined
  }
}
