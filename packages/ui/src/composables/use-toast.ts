import { inject } from 'vue'
import type { InjectionKey } from 'vue'
import type { UiColor } from '@your-scope/theme'

export interface UiToastAction {
  label: string
  onClick: () => void
}

export interface UiToastInput {
  title: string
  description?: string | undefined
  color?: UiColor | undefined
  /**
   * Milliseconds before the toast dismisses itself. `0` keeps it until the
   * user dismisses it; use that (or an inline UiAlert) for information people
   * must not miss. Default: the provider's `duration`.
   */
  duration?: number | undefined
  /**
   * Announce assertively (`role="alert"`). Reserve for exceptional, time
   * critical messages; ordinary toasts are polite status messages.
   */
  urgent?: boolean | undefined
  action?: UiToastAction | undefined
  /** Stable id; re-adding an existing id replaces that toast. */
  id?: string | undefined
}

export interface UiToast {
  readonly id: string
  readonly title: string
  readonly description: string | undefined
  readonly color: UiColor
  readonly duration: number
  readonly urgent: boolean
  readonly action: UiToastAction | undefined
}

export interface UiToastApi {
  /** Queue a notification and return its id. */
  add(toast: UiToastInput): string
  dismiss(id: string): void
  clear(): void
  /** Visible and queued toasts, oldest first (reactive, read-only). */
  readonly toasts: readonly UiToast[]
}

export const uiToastKey: InjectionKey<UiToastApi> = Symbol('vui.toast')

/** Access the notification queue of the nearest UiToastProvider. */
export function useToast(): UiToastApi {
  const api = inject(uiToastKey, undefined)
  if (!api) {
    throw new Error('[@your-scope/ui] useToast() needs a <UiToastProvider> ancestor.')
  }
  return api
}
