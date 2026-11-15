/**
 * Build-time message precompilation.
 *
 * An import with the `?compiled` query, e.g.
 *
 *   import messages from './locales/en.ts?compiled'
 *
 * resolves to the same flat dictionary with every message compiled to the
 * message AST that vue-i18n / petite-vue-i18n evaluate at runtime. Compiled
 * dictionaries work with the regular build and with the runtime-only setup
 * (`__INTLIFY_DROP_MESSAGE_COMPILER__: true`), where the message compiler is
 * tree-shaken out of the application bundle.
 *
 * It uses the official `@intlify/message-compiler`, pinned to the same
 * release line as petite-vue-i18n, and is shared by the library build
 * (published `@your-scope/ui/i18n/locales/*` artifacts) and the gallery.
 */
import { pathToFileURL } from 'node:url'
import { baseCompile } from '@intlify/message-compiler'

const QUERY = '?compiled'

export function compileMessages(
  messages: Readonly<Record<string, string>>,
  source = 'messages',
): Record<string, unknown> {
  const compiled: Record<string, unknown> = {}
  for (const [key, message] of Object.entries(messages)) {
    if (typeof message !== 'string') {
      throw new TypeError(`[compiled-messages] ${source}: "${key}" is not a string`)
    }
    const { ast } = baseCompile(message, {
      jit: true,
      minify: true,
      location: false,
      onError(error) {
        throw new Error(`[compiled-messages] ${source}: "${key}" does not compile: ${error.message}`)
      },
    })
    compiled[key] = ast
  }
  return compiled
}

interface PluginContextLike {
  resolve(source: string, importer?: string): Promise<{ id: string } | null>
  addWatchFile?(id: string): void
}

/** Works as a Vite plugin and as a Rolldown plugin (tsdown). */
export function compiledMessagesPlugin() {
  let version = 0
  return {
    name: 'vui:compiled-messages',
    enforce: 'pre' as const,
    async resolveId(this: PluginContextLike, source: string, importer?: string) {
      if (!source.endsWith(QUERY)) return null
      const resolved = await this.resolve(source.slice(0, -QUERY.length), importer)
      return resolved ? `${resolved.id}${QUERY}` : null
    },
    async load(this: PluginContextLike, id: string) {
      if (!id.endsWith(QUERY)) return null
      const file = id.slice(0, -QUERY.length)
      this.addWatchFile?.(file)
      // Node strips the types of the locale module; the cache-busting query re-reads it in watch mode.
      const module = (await import(`${pathToFileURL(file).href}?v=${++version}`)) as {
        default: Readonly<Record<string, string>>
      }
      return { code: `export default ${JSON.stringify(compileMessages(module.default, file))}\n`, map: null }
    },
  }
}
