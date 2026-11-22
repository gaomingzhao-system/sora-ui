import { onScopeDispose, ref, type Ref } from 'vue'

export const PAGES = ['overview', 'foundations', 'components', 'forms', 'accessibility'] as const
export type PageName = (typeof PAGES)[number]

const parse = (hash: string): PageName => {
  const name = hash.replace(/^#\/?/, '').split(/[/?]/)[0]
  return (PAGES as readonly string[]).includes(name ?? '') ? (name as PageName) : 'overview'
}

/** A five-page hash router: enough for a static gallery, and it works from any sub-path. */
export const useRoute = (): { page: Ref<PageName>; href: (page: PageName) => string } => {
  const page = ref(parse(location.hash))
  const onHashChange = (): void => {
    page.value = parse(location.hash)
  }
  window.addEventListener('hashchange', onHashChange)
  onScopeDispose(() => window.removeEventListener('hashchange', onHashChange))
  return { page, href: (name) => `#/${name}` }
}
