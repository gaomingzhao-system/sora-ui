import { inject, type InjectionKey } from 'vue'
import type { SoraColor } from '@your-scope/theme'

export interface SoraToastAction {
  label: string
  onClick: () => void
}

export interface SoraToastInput {
  title: string
  description?: string | undefined
  color?: SoraColor | undefined
  /**
   * Milliseconds before the toast dismisses itself. `0` keeps it until the
   * user dismisses it; use that (or an inline SoraAlert) for information people
   * must not miss. Default: the provider's `duration`.
   */
  duration?: number | undefined
  /**
   * Announce assertively (`role="alert"`). Reserve for exceptional, time
   * critical messages; ordinary toasts are polite status messages.
   */
  urgent?: boolean | undefined
  action?: SoraToastAction | undefined
  /** Stable id; re-adding an existing id replaces that toast. */
  id?: string | undefined
}

export interface SoraToast {
  readonly id: string
  readonly title: string
  readonly description: string | undefined
  readonly color: SoraColor
  readonly duration: number
  readonly urgent: boolean
  readonly action: SoraToastAction | undefined
}

export interface SoraToastApi {
  /** Queue a notification and return its id. */
  add(toast: SoraToastInput): string
  dismiss(id: string): void
  clear(): void
  /** Visible and queued toasts, oldest first (reactive, read-only). */
  readonly toasts: readonly SoraToast[]
}

export const soraToastKey: InjectionKey<SoraToastApi> = Symbol('sora.toast')

/** Access the notification queue of the nearest SoraToastProvider. */
export const useToast = (): SoraToastApi => {
  const api = inject(soraToastKey, undefined)
  if (!api) {
    throw new Error('[@your-scope/ui] useToast() needs a <SoraToastProvider> ancestor.')
  }
  return api
}
