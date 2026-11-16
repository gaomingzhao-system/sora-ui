import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  componentCategories,
  componentManifest,
  componentNames,
} from '../../packages/ui/src/components.manifest.ts'
import { buildExports } from '../../scripts/sync-exports.ts'

const root = fileURLToPath(new URL('../..', import.meta.url))

/** The initial catalogue from the specification (section 10), by directory. */
const REQUIRED: Readonly<Record<string, readonly string[]>> = {
  foundation: ['UiProvider', 'UiIcon'],
  actions: ['UiButton', 'UiIconButton', 'UiButtonGroup', 'UiLink'],
  display: ['UiCard', 'UiBadge', 'UiAvatar', 'UiAvatarGroup', 'UiSeparator', 'UiKbd', 'UiEmptyState'],
  feedback: ['UiAlert', 'UiSpinner', 'UiProgress', 'UiSkeleton', 'UiToastProvider'],
  inputs: [
    'UiInput',
    'UiTextarea',
    'UiPasswordInput',
    'UiNumberInput',
    'UiDateInput',
    'UiCheckbox',
    'UiCheckboxGroup',
    'UiRadioGroup',
    'UiSwitch',
    'UiSelect',
    'UiCombobox',
    'UiSlider',
    'UiFileInput',
    'UiField',
  ],
  forms: ['UiForm', 'UiFormErrorSummary'],
  overlays: ['UiDialog', 'UiDrawer', 'UiPopover', 'UiTooltip', 'UiDropdownMenu'],
  navigation: ['UiTabs', 'UiAccordion', 'UiBreadcrumbs', 'UiPagination'],
  data: ['UiTable'],
}

describe('component manifest', () => {
  it('lists exactly the 44 components of the initial catalogue', () => {
    expect(componentManifest).toHaveLength(44)
    expect(new Set(componentNames).size).toBe(44)
    for (const [category, names] of Object.entries(REQUIRED)) {
      expect(
        componentManifest
          .filter((entry) => entry.category === category)
          .map((entry) => entry.name)
          .toSorted(),
        category,
      ).toEqual([...names].toSorted())
    }
    expect([...componentCategories].toSorted()).toEqual(Object.keys(REQUIRED).toSorted())
  })

  it('points every entry at an existing SFC in its category directory', () => {
    for (const entry of componentManifest) {
      expect(existsSync(`${root}packages/ui/src/${entry.source}`), entry.source).toBe(true)
      expect(entry.source.endsWith(`/${entry.name}.vue`), entry.name).toBe(true)
      const directory = entry.category === 'forms' ? 'forms/' : `components/${entry.category}/`
      expect(entry.source.startsWith(directory), `${entry.name} in ${directory}`).toBe(true)
      expect(entry.entry).toBe(entry.category === 'forms' ? 'forms' : 'core')
    }
  })

  it('documents every entry', () => {
    for (const entry of componentManifest) {
      expect(entry.summary.length, entry.name).toBeGreaterThan(20)
      expect(entry.attrs.length, entry.name).toBeGreaterThan(10)
      expect(entry.a11y.length, entry.name).toBeGreaterThan(0)
      expect(entry.styling.length, entry.name).toBeGreaterThan(0)
    }
    // Interactive composites must describe their keyboard model.
    for (const name of [
      'UiDialog',
      'UiDrawer',
      'UiDropdownMenu',
      'UiCombobox',
      'UiTabs',
      'UiAccordion',
      'UiRadioGroup',
      'UiSlider',
    ]) {
      expect(componentManifest.find((entry) => entry.name === name)?.keyboard.length, name).toBeGreaterThan(0)
    }
  })

  it('drives the explicit package exports', async () => {
    const exportsMap = buildExports()
    for (const entry of componentManifest) {
      expect(exportsMap[`./components/${entry.name}`]).toEqual({
        types: `./dist/components/${entry.name}.d.ts`,
        import: `./dist/components/${entry.name}.js`,
      })
    }
    expect(Object.keys(exportsMap).some((subpath) => subpath.includes('*'))).toBe(false)
    const manifest = JSON.parse(await readFile(`${root}packages/ui/package.json`, 'utf8')) as {
      exports: unknown
    }
    expect(manifest.exports).toEqual(exportsMap)
  })

  it('exports every core component and its props type from the barrel, and the forms pair from the forms entry', async () => {
    const barrel = await readFile(`${root}packages/ui/src/index.ts`, 'utf8')
    const forms = await readFile(`${root}packages/ui/src/forms/index.ts`, 'utf8')
    for (const entry of componentManifest) {
      const source = entry.entry === 'core' ? barrel : forms
      expect(source, entry.name).toContain(`export { default as ${entry.name} }`)
      expect(source, `${entry.name}Props`).toContain(`${entry.name}Props`)
    }
    // The core barrel must not reach the optional integrations (comments may mention them).
    const statements = barrel.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    expect(statements).not.toMatch(/from '\.\/(forms|i18n)\//)
    expect(statements).not.toMatch(/formisch|valibot|petite/)
  })
})
