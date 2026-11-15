import { createVaporApp, nextTick } from 'vue'
import type { App, Plugin, VaporComponent } from 'vue'

/**
 * Minimal pure-Vapor mounting helper.
 *
 * `createVaporApp` is the only renderer used: there is no Vue Test Utils
 * wrapper and no VDOM app anywhere in the test graph. Every mounted app is
 * tracked so `unmountAll()` (registered in tests/browser/setup.ts) can tear
 * it down deterministically.
 */
export interface MountedVapor {
  readonly app: App
  readonly container: HTMLElement
  unmount(): void
}

export interface MountVaporOptions {
  /** Root props. Pass a `reactive()` object as a prop to drive updates from the test. */
  props?: Record<string, unknown>
  plugins?: readonly Plugin[]
  /** Attributes applied to the host container (for example `dir="rtl"`). */
  containerAttrs?: Record<string, string>
}

const mounted = new Set<MountedVapor>()

export function mountVapor(component: VaporComponent, options: MountVaporOptions = {}): MountedVapor {
  const container = document.createElement('div')
  container.dataset['testRoot'] = ''
  for (const [name, value] of Object.entries(options.containerAttrs ?? {})) {
    container.setAttribute(name, value)
  }
  document.body.append(container)

  const app = createVaporApp(component, options.props ?? null)
  for (const plugin of options.plugins ?? []) app.use(plugin)
  app.mount(container)

  const handle: MountedVapor = {
    app,
    container,
    unmount() {
      if (!mounted.delete(handle)) return
      app.unmount()
      container.remove()
    },
  }
  mounted.add(handle)
  return handle
}

export function unmountAll(): void {
  // Deleting from a Set while iterating it is well defined: every handle is visited once.
  for (const handle of mounted) handle.unmount()
}

/** Flush Vue's scheduler and one animation frame (layout, top-layer and focus changes). */
export async function settle(): Promise<void> {
  await nextTick()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  await nextTick()
}
