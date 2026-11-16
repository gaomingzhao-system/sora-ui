import { nextTick, reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { mountVapor } from '../helpers/mount-vapor.ts'
import DisplayHarness from './harness/DisplayHarness.vue'
import type { DisplayState } from './harness/DisplayHarness.vue'
import { $, all, flush, q, until } from './support.ts'

function setup(overrides: Partial<DisplayState> = {}) {
  const state = reactive<DisplayState>({
    width: '32rem',
    src: undefined,
    name: 'Ada Lovelace',
    people: [
      { name: 'Ada Lovelace' },
      { name: 'Grace Hopper' },
      { name: 'Alan Turing' },
      { name: 'Edsger Dijkstra' },
      { name: 'Barbara Liskov' },
    ],
    max: 3,
    decorative: true,
    ...overrides,
  })
  mountVapor(DisplayHarness, { props: { state } })
  return { state }
}

describe('SoraCard', () => {
  it('renders header, body, actions and footer from props and slots', () => {
    setup()
    const card = q('card')
    expect(card.tagName).toBe('SECTION')
    expect([card.dataset['variant'], card.dataset['padding']]).toEqual(['elevated', 'lg'])
    const title = $('.sora-card__title', card)
    expect(title.tagName).toBe('H2')
    expect(title.textContent).toBe('Account')
    // A sectioning root is named by its title.
    expect(card.getAttribute('aria-labelledby')).toBe(title.id)
    expect($('.sora-card__description', card).textContent).toBe('Manage preferences')
    expect(q('card-badge').closest('.sora-card__actions')).not.toBeNull()
    expect(q('card-body').closest('.sora-card__body')).not.toBeNull()
    expect(q('card-save').closest('.sora-card__footer')).not.toBeNull()
  })

  it('uses the header slot instead of the title, and omits empty parts', () => {
    setup()
    const card = q('card-plain')
    expect(q('custom-header').closest('.sora-card__header')).not.toBeNull()
    expect(card.querySelector('.sora-card__title')).toBeNull()
    expect(card.querySelector('.sora-card__body')).toBeNull()
    expect(card.querySelector('.sora-card__footer')).toBeNull()
    // Defaults come from sora.config.ts.
    expect([card.dataset['variant'], card.dataset['padding']]).toEqual(['outline', 'md'])
    expect(card.hasAttribute('aria-labelledby')).toBe(false)
  })

  it('adapts to its own width: a narrow card stacks its footer buttons', async () => {
    const { state } = setup()
    const footer = $('.sora-card__footer', q('card'))
    expect(getComputedStyle(footer).flexDirection).toBe('row')
    state.width = '14rem'
    await flush()
    // Container query on the card, not a viewport media query.
    expect(getComputedStyle(footer).flexDirection).toBe('column-reverse')
    expect(q('card-save').getBoundingClientRect().width).toBeGreaterThan(150)
  })
})

describe('SoraBadge', () => {
  it('exposes variant, colour and size and renders the leading slot', () => {
    setup()
    const badge = q('badge')
    expect([badge.dataset['variant'], badge.dataset['color'], badge.dataset['size']]).toEqual([
      'solid',
      'error',
      'lg',
    ])
    expect(badge.textContent?.trim()).toBe('Failed')
    expect(badge.querySelector('svg')).not.toBeNull()
    // The status dot is decoration.
    expect($('.sora-badge__dot', q('card-badge')).getAttribute('aria-hidden')).toBe('true')
  })
})

describe('SoraAvatar', () => {
  it('falls back to initials named by `name`, then to a generic glyph', () => {
    setup()
    const avatar = q('avatar')
    expect(avatar.querySelector('img')).toBeNull()
    expect(avatar.getAttribute('role')).toBe('img')
    expect(avatar.getAttribute('aria-label')).toBe('Ada Lovelace')
    expect($('.sora-avatar__initials', avatar).textContent).toBe('AL')
    expect([avatar.dataset['size'], avatar.dataset['shape']]).toEqual(['lg', 'square'])

    const anonymous = q('avatar-anon')
    expect(anonymous.querySelector('svg')).not.toBeNull()
    expect(anonymous.hasAttribute('role')).toBe(false)
  })

  it('shows the image with the name as alt text, and recovers when it fails to load', async () => {
    const pixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    const { state } = setup({ src: pixel })
    const avatar = q('avatar')
    const image = $<HTMLImageElement>('img', avatar)
    expect(image.alt).toBe('Ada Lovelace')
    // The image is the named thing; the wrapper is not also an img.
    expect(avatar.hasAttribute('role')).toBe(false)

    state.src = 'data:image/png;base64,broken'
    await until(() => avatar.querySelector('img') === null)
    expect($('.sora-avatar__initials', avatar).textContent).toBe('AL')

    // A new source gets a fresh chance.
    state.src = pixel
    await nextTick()
    expect(avatar.querySelector('img')).not.toBeNull()
  })
})

describe('SoraAvatarGroup', () => {
  it('is a labelled list that collapses the remainder into a counter with a text alternative', async () => {
    const { state } = setup()
    const group = q('avatar-group')
    expect(group.tagName).toBe('UL')
    expect(group.getAttribute('aria-label')).toBe('Team')
    expect(all('li', group)).toHaveLength(4)
    const more = $('.sora-avatar-group__more', group)
    expect(more.textContent).toContain('+2')
    expect($('.sora-sr-only', more).textContent).toBe('More: 2')

    state.max = 5
    await nextTick()
    expect(all('li', group)).toHaveLength(5)
    expect(group.querySelector('.sora-avatar-group__more')).toBeNull()
  })
})

describe('SoraSeparator', () => {
  it('is decorative by default and a real separator on request', async () => {
    const { state } = setup()
    const separator = q('separator')
    expect(separator.getAttribute('role')).toBe('none')
    expect(separator.hasAttribute('aria-orientation')).toBe(false)
    state.decorative = false
    await nextTick()
    expect(separator.getAttribute('role')).toBe('separator')
    expect(separator.getAttribute('aria-orientation')).toBe('vertical')
    expect(q('separator-label').textContent?.trim()).toBe('or')
  })
})

describe('SoraKbd', () => {
  it('uses kbd elements, one per key for a shortcut', () => {
    setup()
    expect(q('kbd').tagName).toBe('KBD')
    expect(q('kbd').textContent?.trim()).toBe('Esc')
    const combo = q('kbd-combo')
    expect(combo.tagName).toBe('KBD')
    expect(all('kbd', combo).map((key) => key.textContent)).toEqual(['Ctrl', 'Shift', 'K'])
    for (const separator of all('.sora-kbd-combo__separator', combo)) {
      expect(separator.getAttribute('aria-hidden')).toBe('true')
    }
  })
})

describe('SoraEmptyState', () => {
  it('has a real heading, a description and an actions slot', () => {
    setup()
    const empty = q('empty')
    const title = $('.sora-empty-state__title', empty)
    expect(title.tagName).toBe('H4')
    expect(title.textContent).toBe('No projects')
    expect($('.sora-empty-state__description', empty).textContent?.trim()).toBe('Create one to get started.')
    expect($('.sora-empty-state__icon', empty).getAttribute('aria-hidden')).toBe('true')
    expect(q('empty-action').closest('.sora-empty-state__actions')).not.toBeNull()
  })
})

describe('SoraIcon', () => {
  it('is hidden when decorative and an image when named', () => {
    setup()
    const decorative = q('icon-decorative')
    expect(decorative.tagName.toLowerCase()).toBe('svg')
    expect(decorative.getAttribute('aria-hidden')).toBe('true')
    expect(decorative.hasAttribute('role')).toBe(false)
    expect(decorative.namespaceURI).toBe('http://www.w3.org/2000/svg')
    expect(decorative.querySelectorAll('path').length).toBeGreaterThan(0)

    const named = q('icon-named')
    expect(named.getAttribute('role')).toBe('img')
    expect(named.getAttribute('aria-label')).toBe('Search')
    expect(named.hasAttribute('aria-hidden')).toBe(false)
    expect(named.getBoundingClientRect().width).toBe(20)
  })

  it('mirrors only directional glyphs in right-to-left text', () => {
    setup()
    expect(getComputedStyle(q('icon-rtl')).transform).toBe('matrix(-1, 0, 0, 1, 0, 0)')
    expect(getComputedStyle(q('icon-rtl-plain')).transform).toBe('none')
  })
})
