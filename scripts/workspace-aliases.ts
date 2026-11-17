import { join } from 'node:path'

/**
 * Source aliases for workspace-internal tooling (gallery dev/build and the
 * Vitest projects). They let the apps and tests run against `packages/*`
 * sources without a prior build.
 *
 * The packed-artifact consumers (`apps/consumer`, `tests/fixtures/consumer-*`)
 * never use these: `pnpm verify:consumer` installs the real tarballs.
 */
export interface WorkspaceAlias {
  find: RegExp
  replacement: string
}

export function workspaceAliases(root: string): WorkspaceAlias[] {
  const ui = join(root, 'packages/ui/src')
  const theme = join(root, 'packages/theme/src')
  return [
    { find: /^@your-scope\/theme$/, replacement: join(theme, 'index.ts') },
    { find: /^@your-scope\/ui$/, replacement: join(ui, 'index.ts') },
    { find: /^@your-scope\/ui\/forms$/, replacement: join(ui, 'forms/index.ts') },
    { find: /^@your-scope\/ui\/i18n$/, replacement: join(ui, 'i18n/index.ts') },
    { find: /^@your-scope\/ui\/theme$/, replacement: join(ui, 'theme/index.ts') },
    { find: /^@your-scope\/ui\/i18n\/locales\/(.+)$/, replacement: join(ui, 'i18n/locales/$1.ts') },
    { find: /^@your-scope\/ui\/locales\/(.+)$/, replacement: join(ui, 'locales/$1.ts') },
    { find: /^@your-scope\/ui\/styles\.css$/, replacement: join(ui, 'styles/index.css') },
    { find: /^@your-scope\/ui\/tailwind\.css$/, replacement: join(ui, 'styles/tailwind.css') },
  ]
}
