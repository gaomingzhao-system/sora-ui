import { computed, inject, nextTick, onBeforeUnmount, onMounted, provide, shallowRef, watch } from 'vue'
import type { ComputedRef, InjectionKey, Ref, ShallowRef } from 'vue'
import {
  clamp,
  createSheetSpring,
  createVelocityTracker,
  findSnapIndex,
  releaseTarget,
  rubberBand,
  snapOffsets,
} from '../internal/sheet.ts'
import type { SheetSpring, SoraSnapPoint } from '../internal/sheet.ts'
import type { SoraCloseReason } from './use-overlay.ts'

export type SoraDrawerSide = 'bottom' | 'top' | 'start' | 'end'

export interface UseSheetOptions {
  open: Ref<boolean>
  snapPoint: Ref<SoraSnapPoint | undefined>
  snapPoints: () => readonly SoraSnapPoint[]
  side: () => SoraDrawerSide
  dismissible: () => boolean
  modal: () => boolean
  fadeFrom: () => number
  scaleBackground: () => boolean | string
  closeThreshold: () => number
  handleOnly: () => boolean
  /** The layer: a `<dialog>` for a modal sheet, a manual popover element otherwise. */
  dialog: () => HTMLElement | null
  panel: () => HTMLElement | null
  backdrop: () => HTMLElement | null
  /** The scrollable content area. */
  body: () => HTMLElement | null
  footer: () => HTMLElement | null
  onDrag: (progress: number) => void
  onOpened: () => void
  onClosed: (reason: SoraCloseReason) => void
}

export interface Sheet {
  /** Shown or on its way in (`false` while it animates out). */
  readonly visible: ShallowRef<boolean>
  readonly dragging: ShallowRef<boolean>
  /** Resting at its largest snap point: only then does its content scroll. */
  readonly expanded: ComputedRef<boolean>
  readonly activeSnapPoint: ComputedRef<SoraSnapPoint>
  close(reason?: SoraCloseReason): void
  snapTo(point: SoraSnapPoint): void
  /** Move to the next (`1`) or previous (`-1`) snap point, or cycle through them (`0`). */
  step(direction: -1 | 0 | 1): void
  onPointerdown(event: PointerEvent): void
  onCancel(event: Event): void
  onNativeClose(): void
  onKeydown(event: KeyboardEvent): void
  onBackdropClick(): void
}

/** Lets a sheet push back the sheet it was opened from, as a stack of cards. */
interface SheetContext {
  panel(): HTMLElement | null
  /** Style of the parent panel while a nested sheet is `progress` (0 to 1) open. */
  frame(progress: number): Keyframe
  settle(progress: number): void
}

const sheetKey: InjectionKey<SheetContext> = Symbol('sora.sheet')

/** Distance (px) a finger or pen has to travel before a gesture is recognised. */
const TOUCH_SLOP = 10
const MOUSE_SLOP = 2
/** Distance (px) from fully open at which a settling sheet already lets its content scroll. */
const SCROLL_SLOP = 24
/** Furthest (px) a sheet can be pulled past its range. */
const MAX_OVERDRAG = 64
/** Pixels a sheet moves back (and loses on each side) while another one is open on top of it. */
const NESTED_SHIFT = 16
/** The page pushed back behind an expanded sheet: inset per side, shift and corner radius (px). */
const BACKGROUND_INSET = 13
const BACKGROUND_SHIFT = 14
const BACKGROUND_RADIUS = 10
/** One keyframe per this many ms of flight; the compositor interpolates in between. */
const KEYFRAME_INTERVAL = 20

type Phase = 'closed' | 'opening' | 'open' | 'closing'

interface Gesture {
  pointerId: number
  pointerType: string
  x: number
  y: number
  /** Offset when the gesture started. */
  origin: number
  dragging: boolean
  /** Scroll container under the pointer, which may take the gesture instead. */
  scroller: HTMLElement | null
  /** The press caught a sheet in flight; it resumes unless the gesture becomes a drag. */
  interrupted: boolean
  /** Removes the window listeners of this gesture. */
  abort: AbortController
}

/** Something that moves with the sheet: the panel itself, the backdrop, the footer, what is behind. */
interface Follower {
  element: HTMLElement
  frame(offset: number): Keyframe
}

interface Flight {
  spring: SheetSpring
  animations: Animation[]
  target: number
  done: (() => void) | undefined
}

/**
 * Drives a native sheet: opening and closing, snap points, dragging, and
 * everything that follows the sheet (backdrop, footer, the page behind it
 * and the sheet it is nested in).
 *
 * Performance notes:
 *   - Only `transform`, `opacity` and (opt-in) `clip-path` are ever written.
 *   - A drag writes once per animation frame, whatever the pointer rate.
 *   - Settling runs as Web Animations on the compositor; the main thread is
 *     not needed while the sheet is in flight.
 *   - The spring has a closed form, so catching a sheet in flight needs no
 *     style read-back and keeps its velocity.
 */
export function useSheet(options: UseSheetOptions): Sheet {
  const { open, snapPoint } = options

  const visible = shallowRef(false)
  const dragging = shallowRef(false)
  const size = shallowRef(0)

  const vertical = computed(() => options.side() === 'top' || options.side() === 'bottom')
  const points = computed(() => {
    const list = options.snapPoints()
    return list.length > 0 ? list : [1]
  })
  const offsets = computed(() => snapOffsets(points.value, size.value))
  const openOffset = computed(() => Math.min(...offsets.value))
  const lowestOffset = computed(() => Math.max(...offsets.value))
  const activeIndex = shallowRef(Math.max(findSnapIndex(points.value, snapPoint.value), 0))
  const activeSnapPoint = computed<SoraSnapPoint>(
    () => points.value[activeIndex.value] ?? points.value[0] ?? 1,
  )
  const expanded = computed(() => (offsets.value[activeIndex.value] ?? 0) <= openOffset.value + 0.5)

  const tracker = createVelocityTracker()
  const parent = inject(sheetKey, null)

  let phase: Phase = 'closed'
  /** Offset the sheet is rendered at (its target while it is in flight). */
  let position = 0
  /** `1` when the sheet closes towards positive coordinates (down, or right). */
  let sign: 1 | -1 = 1
  /** How long (ms) the sheet takes to settle; `0` turns animation off. */
  let settleTime = 0
  /** How far a sheet nested in this one is open, from 0 to 1. */
  let nested = 0
  /** How far (px) the footer may rise to stay on screen. */
  let footerRange = 0
  let gesture: Gesture | null = null
  let flight: Flight | null = null
  let frame = 0
  let reason: SoraCloseReason = 'programmatic'
  /** Speed of the release that is closing the sheet, until `open` has been updated. */
  let closeSpeed = 0
  let background: HTMLElement | null = null
  let backgroundInset = '0px'
  const backgroundSaved = new Map<string, string>()
  let observer: ResizeObserver | undefined
  let followers: Follower[] = []

  // ---------------------------------------------------------------- rendering
  function panelTransform(offset: number, behind: number): string {
    const shift = sign * (offset - NESTED_SHIFT * behind)
    const translate = vertical.value ? `translate3d(0, ${shift}px, 0)` : `translate3d(${shift}px, 0, 0)`
    if (behind === 0) return translate
    const cross = vertical.value ? window.innerWidth : window.innerHeight
    return `${translate} scale(${1 - (NESTED_SHIFT / cross) * behind})`
  }

  /** 0 when closed, 1 from the smallest snap point on. */
  function openProgress(offset: number): number {
    const range = size.value - lowestOffset.value
    return range > 0 ? clamp((size.value - offset) / range, 0, 1) : Number(offset < size.value)
  }

  /** The backdrop fades in on the way from the snap point before `fadeFrom` to `fadeFrom`. */
  function backdropOpacity(offset: number): number {
    const list = offsets.value
    const index = clamp(Math.round(options.fadeFrom()), 0, list.length - 1)
    const full = list[index] ?? 0
    const none = index > 0 ? (list[index - 1] ?? size.value) : size.value
    if (none <= full) return Number(offset <= full)
    return clamp((none - offset) / (none - full), 0, 1)
  }

  /** The page is pushed back on the way from the second largest snap point to the largest. */
  function backgroundFrame(offset: number): Keyframe {
    const [full = 0, from = size.value] = offsets.value.toSorted((a, b) => a - b)
    const progress = from > full ? clamp((from - offset) / (from - full), 0, 1) : Number(offset <= full)
    const side = options.side()
    const scale =
      1 - ((2 * BACKGROUND_INSET) / (vertical.value ? window.innerWidth : window.innerHeight)) * progress
    const shift = BACKGROUND_SHIFT * progress * sign
    // Clear the notch when the page moves down.
    const translate = vertical.value
      ? `translate3d(0, calc(${shift}px${side === 'bottom' ? ` + env(safe-area-inset-top, 0px) * ${progress}` : ''}), 0)`
      : `translate3d(${shift}px, 0, 0)`
    return {
      transform: `${translate} scale(${scale})`,
      clipPath: `inset(${backgroundInset} round ${BACKGROUND_RADIUS * progress}px)`,
    }
  }

  /** Everything that moves with the sheet, collected once per opening. */
  function collectFollowers(): Follower[] {
    const list: Follower[] = []
    const panel = options.panel()
    if (panel)
      list.push({ element: panel, frame: (offset) => ({ transform: panelTransform(offset, nested) }) })
    const backdrop = options.backdrop()
    if (backdrop) list.push({ element: backdrop, frame: (offset) => ({ opacity: backdropOpacity(offset) }) })
    const footer = options.footer()
    if (footer && options.side() === 'bottom') {
      // Keep the footer on screen while only part of the sheet is.
      list.push({
        element: footer,
        frame: (offset) => ({ transform: `translate3d(0, ${-clamp(offset, 0, footerRange)}px, 0)` }),
      })
    }
    if (background) list.push({ element: background, frame: backgroundFrame })
    const behind = parent?.panel()
    if (parent && behind)
      list.push({ element: behind, frame: (offset) => parent.frame(openProgress(offset)) })
    return list
  }

  function render(offset: number): void {
    position = offset
    for (const follower of followers) {
      // `frame()` only ever returns style properties.
      Object.assign(follower.element.style, follower.frame(offset))
    }
    parent?.settle(openProgress(offset))
  }

  /** While dragging: at most one write per animation frame. */
  function renderSoon(offset: number): void {
    position = offset
    if (frame !== 0) return
    frame = requestAnimationFrame(() => {
      frame = 0
      render(position)
      options.onDrag(size.value > 0 ? clamp((size.value - position) / size.value, 0, 1) : 0)
    })
  }

  function setMoving(moving: boolean): void {
    // Promotes the panel to its own layer only while it moves.
    options.dialog()?.toggleAttribute('data-moving', moving)
  }

  // --------------------------------------------------------------- animation
  /** Where the sheet is right now, also in the middle of a flight. */
  function currentPosition(): number {
    if (!flight) return position
    return flight.spring.position(Number(flight.animations[0]?.currentTime ?? 0))
  }

  function currentVelocity(): number {
    return flight ? flight.spring.velocity(Number(flight.animations[0]?.currentTime ?? 0)) : 0
  }

  /** Stop a flight where it is. Returns the velocity it had, or `null` when nothing was flying. */
  function freeze(): number | null {
    if (!flight) return null
    const at = currentPosition()
    const speed = currentVelocity()
    const { animations } = flight
    flight = null
    render(at)
    for (const animation of animations) animation.cancel()
    return speed
  }

  /** Fly to `target`, starting at `speed`. */
  function animate(target: number, speed = 0, done?: () => void): void {
    // Continue from wherever a running flight has got to, with its momentum.
    const carried = freeze()
    const start = position
    const velocity = carried !== null && speed === 0 ? carried : speed
    if (
      settleTime === 0 ||
      followers.length === 0 ||
      (Math.abs(target - start) < 0.5 && Math.abs(velocity) < 0.05)
    ) {
      render(target)
      setMoving(false)
      done?.()
      return
    }

    const spring = createSheetSpring(start, target, velocity, settleTime)
    const steps = Math.max(2, Math.ceil(spring.duration / KEYFRAME_INTERVAL))
    const timing: KeyframeAnimationOptions = { duration: spring.duration, easing: 'linear', fill: 'forwards' }
    setMoving(true)

    const animations = followers.map((follower) => {
      const frames: Keyframe[] = []
      for (let index = 0; index <= steps; index++) {
        frames.push(
          follower.frame(index === steps ? target : spring.position((spring.duration * index) / steps)),
        )
      }
      return follower.element.animate(frames, timing)
    })
    const current: Flight = { spring, animations, target, done }
    flight = current
    position = target

    const land = (): void => {
      // Cancelled by `freeze()` or replaced by another flight: whoever did that decides what happens next.
      if (flight !== current) return
      flight = null
      clearTimeout(timer)
      // Inline styles first, then drop the animations: no frame shows a gap.
      render(target)
      for (const animation of animations) animation.cancel()
      setMoving(false)
      current.done?.()
    }
    animations[0]?.addEventListener('finish', land, { once: true })
    // A hidden page stops updating animations; the sheet still has to arrive.
    const timer = setTimeout(land, spring.duration + 100)
  }

  // ------------------------------------------------------ opening and closing
  function show(): void {
    if (phase === 'open' || phase === 'opening') return
    const dialog = options.dialog()
    if (!dialog?.isConnected) return
    const reopening = phase === 'closing'
    phase = 'opening'
    visible.value = true

    if (!reopening) {
      reason = 'programmatic'
      if (dialog instanceof HTMLDialogElement) {
        // `showModal()` focuses the panel (it carries `autofocus`), so the
        // sheet is announced by its name; a marked element in the content wins.
        if (!dialog.open) dialog.showModal()
        options.panel()?.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true })
      } else if (!dialog.matches(':popover-open')) {
        // A non-modal sheet leaves focus where it is, like any panel on the page.
        dialog.showPopover()
      }
      setup(dialog)
      measure()
      // Start from the closed position, off screen.
      render(size.value)
    }
    animate(offsets.value[activeIndex.value] ?? 0, 0, settled)
  }

  function settled(): void {
    if (phase !== 'opening') return
    phase = 'open'
    options.onOpened()
  }

  function hide(speed = 0): void {
    if (phase === 'closed' || phase === 'closing') return
    endGesture()
    phase = 'closing'
    visible.value = false
    animate(size.value, speed, finishClose)
  }

  function finishClose(): void {
    if (phase === 'closed') return
    phase = 'closed'
    visible.value = false
    teardown()
    const dialog = options.dialog()
    if (dialog?.isConnected) {
      // Closing natively restores focus to whatever opened the sheet.
      if (dialog instanceof HTMLDialogElement && dialog.open) dialog.close()
      else if (dialog.matches(':popover-open')) dialog.hidePopover()
    }
    activeIndex.value = 0
    if (snapPoint.value !== undefined && findSnapIndex(points.value, snapPoint.value) !== 0) {
      snapPoint.value = points.value[0]
    }
    const closedBy = reason
    reason = 'programmatic'
    options.onClosed(closedBy)
  }

  function setup(dialog: HTMLElement): void {
    const style = getComputedStyle(dialog)
    const side = options.side()
    const rtl = style.direction === 'rtl'
    sign = side === 'bottom' || (side === 'end' && !rtl) || (side === 'start' && rtl) ? 1 : -1
    // The motion tokens decide how long a sheet takes (0 with reduced motion or `motion: none`).
    const token = style.getPropertyValue('--sora-duration-sheet').trim()
    const value = Number.parseFloat(token)
    settleTime = Number.isFinite(value) ? (token.endsWith('ms') ? value : value * 1000) : 420

    if (!parent && options.scaleBackground()) activateBackground()
    followers = collectFollowers()

    const panel = options.panel()
    if (panel) {
      observer = new ResizeObserver(onResize)
      observer.observe(panel)
    }
  }

  function teardown(): void {
    observer?.disconnect()
    observer = undefined
    if (frame !== 0) cancelAnimationFrame(frame)
    frame = 0
    setMoving(false)
    followers = []
    const footer = options.footer()
    if (footer) footer.style.transform = ''
    deactivateBackground()
    // The sheet this one was opened from comes forward again.
    const behind = parent?.panel()
    if (parent) {
      parent.settle(0)
      if (behind) Object.assign(behind.style, parent.frame(0))
    }
  }

  /** Close the sheet, starting at `speed` after a release. */
  function close(why: SoraCloseReason = 'programmatic', speed = 0): void {
    if (phase === 'closed' || phase === 'closing') return
    reason = why
    closeSpeed = speed
    open.value = false
    void nextTick(() => {
      closeSpeed = 0
      // The owner kept the sheet open by not updating `v-model:open`.
      if (open.value) resume()
    })
  }

  // ----------------------------------------------------------------- snapping
  function setSnap(index: number, speed = 0): void {
    const point = points.value[index]
    if (point === undefined) return
    activeIndex.value = index
    if (findSnapIndex(points.value, snapPoint.value) !== index) snapPoint.value = point
    if (phase === 'open' || phase === 'opening') animate(offsets.value[index] ?? 0, speed, settled)
  }

  function snapTo(point: SoraSnapPoint): void {
    const index = findSnapIndex(points.value, point)
    if (index !== -1) setSnap(index)
  }

  function step(direction: -1 | 0 | 1): void {
    const count = points.value.length
    if (count < 2) return
    // Snap points are listed from the smallest to the largest.
    if (direction === 0) setSnap((activeIndex.value + 1) % count)
    else setSnap(clamp(activeIndex.value + direction, 0, count - 1))
  }

  function measure(): void {
    const panel = options.panel()
    if (!panel) return
    size.value = vertical.value ? panel.offsetHeight : panel.offsetWidth
    const footer = options.footer()
    const body = options.body()
    footerRange = footer && body ? Math.max(0, footer.offsetTop - body.offsetTop) : 0
  }

  function onResize(): void {
    if (phase === 'closed') return
    const previous = size.value
    measure()
    if (size.value === previous || gesture?.dragging) return
    if (phase === 'closing') animate(size.value, 0, finishClose)
    else if (flight) animate(offsets.value[activeIndex.value] ?? 0, 0, settled)
    else render(offsets.value[activeIndex.value] ?? 0)
  }

  function resume(): void {
    if (phase === 'open' || phase === 'opening') animate(offsets.value[activeIndex.value] ?? 0, 0, settled)
  }

  // ----------------------------------------------------------------- gestures
  function onPointerdown(event: PointerEvent): void {
    if (gesture || !event.isPrimary || event.button > 0) return
    if (phase !== 'open' && phase !== 'opening') return
    const panel = options.panel()
    const target = event.target
    if (!panel || !(target instanceof Element) || !canGrab(target, event.pointerType)) return

    const abort = new AbortController()
    gesture = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      x: event.clientX,
      y: event.clientY,
      origin: 0,
      dragging: false,
      scroller: findScrollable(target, panel, vertical.value),
      // Catch a sheet in flight under the finger.
      interrupted: freeze() !== null,
      abort,
    }
    gesture.origin = position
    tracker.reset()
    tracker.add(event.timeStamp, axis(event))
    const listen = { signal: abort.signal }
    window.addEventListener('pointermove', onPointermove, listen)
    window.addEventListener('pointerup', onPointerup, listen)
    window.addEventListener('pointercancel', onPointercancel, listen)
  }

  function canGrab(target: Element, pointerType: string): boolean {
    if (target.closest('[data-sora-no-drag], select, input[type="range"]')) return false
    if (options.handleOnly() && !target.closest('.sora-drawer__handle, [data-sora-drag-handle]')) return false
    // Let a mouse select text in fields instead of dragging the sheet.
    if (
      pointerType === 'mouse' &&
      target.closest('input, textarea, [contenteditable]:not([contenteditable="false"])')
    ) {
      return false
    }
    const selection = window.getSelection()
    return !selection || selection.isCollapsed || !options.panel()?.contains(selection.anchorNode)
  }

  /** Whether moving `main` px along the drag axis moves the sheet rather than its content. */
  function wantsDrag(current: Gesture, main: number): boolean {
    // Content only scrolls once the sheet is (nearly) settled at its largest snap point.
    const settledOpen = expanded.value && position <= openOffset.value + SCROLL_SLOP
    if (!settledOpen || !current.scroller) return true
    return !canScroll(current.scroller, vertical.value, main > 0)
  }

  function onPointermove(event: PointerEvent): void {
    const current = gesture
    if (!current || event.pointerId !== current.pointerId) return
    const main = vertical.value ? event.clientY - current.y : event.clientX - current.x
    const cross = vertical.value ? event.clientX - current.x : event.clientY - current.y

    if (!current.dragging) {
      const slop = current.pointerType === 'mouse' ? MOUSE_SLOP : TOUCH_SLOP
      if (Math.abs(main) < slop && Math.abs(cross) < slop) return
      if (Math.abs(cross) > Math.abs(main) || !wantsDrag(current, main)) {
        cancelGesture()
        return
      }
      startDrag(current, event)
    }

    // Every sample the browser coalesced into this event improves the release velocity.
    const samples = event.getCoalescedEvents?.() ?? []
    if (samples.length > 1) for (const sample of samples) tracker.add(sample.timeStamp, axis(sample))
    else tracker.add(event.timeStamp, axis(event))
    drag(current.origin + main * sign)
  }

  // Pointer events stop once the browser starts scrolling, so the browser is
  // held back while a move may still become a drag.
  function onTouchmove(event: TouchEvent): void {
    const current = gesture
    if (!current || !event.cancelable) return
    if (current.dragging) {
      event.preventDefault()
      return
    }
    const touch = event.touches[0]
    if (!touch) return
    const main = vertical.value ? touch.clientY - current.y : touch.clientX - current.x
    const cross = vertical.value ? touch.clientX - current.x : touch.clientY - current.y
    if (main !== 0 && Math.abs(main) >= Math.abs(cross) && wantsDrag(current, main)) event.preventDefault()
  }

  function startDrag(current: Gesture, event: PointerEvent): void {
    current.dragging = true
    dragging.value = true
    setMoving(true)
    const panel = options.panel()
    try {
      panel?.setPointerCapture(event.pointerId)
    } catch {
      // The pointer is already gone.
    }
    // Drop the text selection the press may have started.
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed && panel?.contains(selection.anchorNode))
      selection.removeAllRanges()
  }

  function drag(offset: number): void {
    const dismissible = options.dismissible()
    const min = openOffset.value
    const max = dismissible ? size.value : lowestOffset.value
    const limit = Math.min(MAX_OVERDRAG, size.value * 0.2)
    let next = offset
    if (offset < min) next = min - rubberBand(min - offset, limit)
    else if (offset > max) next = dismissible ? max : max + rubberBand(offset - max, limit)
    renderSoon(next)
  }

  function onPointerup(event: PointerEvent): void {
    const current = gesture
    if (!current || event.pointerId !== current.pointerId) return
    endGesture()
    if (current.dragging) {
      tracker.add(event.timeStamp, axis(event))
      const panel = options.panel()
      if (panel) suppressClick(panel, event.timeStamp)
      release(tracker.velocity(event.timeStamp) * sign)
    } else if (current.interrupted) {
      resume()
    }
  }

  function onPointercancel(event: PointerEvent): void {
    const current = gesture
    if (!current || event.pointerId !== current.pointerId) return
    endGesture()
    if (current.dragging) release(0)
    else if (current.interrupted) resume()
  }

  /** Hand the gesture over to the content or the page. */
  function cancelGesture(): void {
    const current = gesture
    endGesture()
    if (current?.interrupted) resume()
  }

  function endGesture(): void {
    const current = gesture
    if (!current) return
    gesture = null
    dragging.value = false
    current.abort.abort()
    const panel = options.panel()
    if (current.dragging && panel?.hasPointerCapture(current.pointerId)) {
      panel.releasePointerCapture(current.pointerId)
    }
    if (frame !== 0) {
      // Flush the last drag frame so the release starts from the right place.
      cancelAnimationFrame(frame)
      frame = 0
      render(position)
    }
  }

  function release(speed: number): void {
    const target = releaseTarget({
      offsets: offsets.value,
      closed: size.value,
      position,
      velocity: speed,
      dismissible: options.dismissible(),
      closeThreshold: options.closeThreshold(),
    })
    if (target.type === 'close') close('drag', speed)
    else setSnap(target.index, speed)
  }

  const axis = (event: PointerEvent): number => (vertical.value ? event.clientY : event.clientX)

  // ------------------------------------------------- the page behind the sheet
  function activateBackground(): void {
    const target = options.scaleBackground()
    const element = document.querySelector<HTMLElement>(
      typeof target === 'string' ? target : '[data-sora-drawer-background]',
    )
    if (!element) return
    background = element
    for (const property of ['transform', 'transformOrigin', 'clipPath', 'willChange'] as const) {
      backgroundSaved.set(property, element.style[property])
    }
    // Scale around the viewport edge facing away from the sheet and round only
    // the part of the page that is on screen, so a scrolled page stays in place.
    const rect = element.getBoundingClientRect()
    const width = window.innerWidth
    const height = window.innerHeight
    const top = Math.max(0, -rect.top)
    const left = Math.max(0, -rect.left)
    backgroundInset = `${top}px ${Math.max(0, rect.right - width)}px ${Math.max(0, rect.bottom - height)}px ${left}px`
    const centerX = width / 2 - rect.left
    const centerY = height / 2 - rect.top
    if (vertical.value)
      element.style.transformOrigin = `${centerX}px ${sign === 1 ? top : height - rect.top}px`
    else element.style.transformOrigin = `${sign === 1 ? left : width - rect.left}px ${centerY}px`
    element.style.willChange = 'transform'
    document.documentElement.toggleAttribute('data-sora-drawer-scaled', true)
  }

  function deactivateBackground(): void {
    if (!background) return
    for (const [property, value] of backgroundSaved) background.style.setProperty(kebab(property), value)
    backgroundSaved.clear()
    background = null
    document.documentElement.removeAttribute('data-sora-drawer-scaled')
  }

  // --------------------------------------------------------------------- wiring
  provide(sheetKey, {
    panel: options.panel,
    frame: (progress) => ({ transform: panelTransform(position, progress) }),
    settle(progress) {
      nested = progress
    },
  })

  watch(open, (value) => (value ? show() : hide(closeSpeed)), { flush: 'post' })

  watch(snapPoint, (value) => {
    const index = findSnapIndex(points.value, value)
    if (index !== -1 && index !== activeIndex.value) setSnap(index)
  })

  watch(points, (list) => {
    const index = findSnapIndex(list, snapPoint.value)
    activeIndex.value = index === -1 ? clamp(activeIndex.value, 0, list.length - 1) : index
    if (phase === 'open' && !gesture?.dragging) animate(offsets.value[activeIndex.value] ?? 0, 0, settled)
  })

  /** Ends every listener this sheet registered for its lifetime. */
  const lifetime = new AbortController()

  onMounted(() => {
    // Not passive on purpose: it has to be able to keep the browser from
    // scrolling when a touch turns into a drag. It is scoped to the panel.
    options.panel()?.addEventListener('touchmove', onTouchmove, { passive: false, signal: lifetime.signal })
    if (open.value) show()
  })

  onBeforeUnmount(() => {
    endGesture()
    lifetime.abort()
    const pending = flight
    flight = null
    if (pending) for (const animation of pending.animations) animation.cancel()
    if (phase !== 'closed') {
      phase = 'closed'
      teardown()
      // Leaving a modal dialog open would keep the page inert.
      const dialog = options.dialog()
      if (dialog instanceof HTMLDialogElement && dialog.open) dialog.close()
      else if (dialog?.matches(':popover-open')) dialog.hidePopover()
    }
  })

  return {
    visible,
    dragging,
    expanded,
    activeSnapPoint,
    close: (why = 'action') => close(why),
    snapTo,
    step,
    onPointerdown,
    onCancel(event) {
      // Escape and other platform close requests. The sheet always leaves with
      // its own animation, so the native close is held back.
      event.preventDefault()
      if (options.dismissible()) close('escape')
    },
    onNativeClose() {
      // Closed behind our back (`dialog.close()`, a `method="dialog"` form).
      if (phase === 'closed') return
      const pending = flight
      flight = null
      if (pending) for (const animation of pending.animations) animation.cancel()
      endGesture()
      reason = reason === 'programmatic' ? 'action' : reason
      finishClose()
      if (open.value) open.value = false
    },
    onKeydown(event) {
      // A non-modal sheet has no native close request; give it Escape while focus is inside.
      if (event.key !== 'Escape' || options.modal() || event.defaultPrevented) return
      if (options.dismissible()) {
        event.preventDefault()
        close('escape')
      }
    },
    onBackdropClick() {
      if (options.dismissible()) close('backdrop')
    },
  }
}

const kebab = (property: string): string => property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

/** Nearest ancestor of `target`, below `boundary`, that scrolls along the given axis. */
function findScrollable(target: Element, boundary: Element, vertical: boolean): HTMLElement | null {
  for (
    let element: Element | null = target;
    element && element !== boundary;
    element = element.parentElement
  ) {
    if (!(element instanceof HTMLElement)) continue
    const style = getComputedStyle(element)
    const overflow = vertical ? style.overflowY : style.overflowX
    if (overflow !== 'auto' && overflow !== 'scroll') continue
    const scrolls = vertical
      ? element.scrollHeight > element.clientHeight + 1
      : element.scrollWidth > element.clientWidth + 1
    if (scrolls) return element
  }
  return null
}

/**
 * Whether `element` can still scroll when a finger moves along the axis:
 * back towards its start when `towardStart` (the finger moves down or right).
 */
function canScroll(element: HTMLElement, vertical: boolean, towardStart: boolean): boolean {
  const position = Math.abs(vertical ? element.scrollTop : element.scrollLeft)
  const max = vertical
    ? element.scrollHeight - element.clientHeight
    : element.scrollWidth - element.clientWidth
  return towardStart ? position > 0.5 : position < max - 0.5
}

/**
 * Swallow the click a drag of `panel` ends with, so releasing over a button
 * does not press it. Only that click goes: a real one, inside the sheet,
 * right after the release. The next click or press disarms it.
 */
function suppressClick(panel: HTMLElement, releasedAt: number): void {
  const abort = new AbortController()
  const listen = { capture: true, signal: abort.signal }
  window.addEventListener(
    'click',
    (event) => {
      abort.abort()
      const target = event.target
      if (
        event.isTrusted &&
        event.timeStamp - releasedAt < 100 &&
        target instanceof Node &&
        panel.contains(target)
      ) {
        event.preventDefault()
        event.stopPropagation()
      }
    },
    listen,
  )
  window.addEventListener('pointerdown', () => abort.abort(), listen)
}
