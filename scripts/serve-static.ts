/**
 * Minimal static file server for the end-to-end tests: serves one built
 * directory on 127.0.0.1. No dependencies, no directory listings.
 *
 *   node scripts/serve-static.ts <directory> <port>
 */
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'

const [directory, portArgument] = process.argv.slice(2)
const port = Number(portArgument)
if (!directory || !Number.isInteger(port)) {
  console.error('usage: node scripts/serve-static.ts <directory> <port>')
  process.exit(2)
}
const base = resolve(directory)
try {
  await stat(`${base}${sep}index.html`)
} catch {
  console.error(`serve-static: ${base}${sep}index.html does not exist. Build it first.`)
  process.exit(1)
}

const types: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
  const file = resolve(base, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`)
  // Never serve anything outside the directory.
  if (file !== base && !file.startsWith(`${base}${sep}`)) {
    response.writeHead(403).end()
    return
  }
  try {
    const info = await stat(file)
    if (!info.isFile()) throw new Error('not a file')
    response.writeHead(200, {
      'content-type': types[extname(file)] ?? 'application/octet-stream',
      'content-length': info.size,
      'cache-control': 'no-store',
    })
    createReadStream(file).pipe(response)
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found')
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`serving ${base} on http://127.0.0.1:${port}/`)
})
