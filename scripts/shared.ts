/** Small helpers shared by the verification scripts. */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

export const root = fileURLToPath(new URL('..', import.meta.url))
export const artifacts = `${root}.artifacts`
export const tarballDir = `${artifacts}/packages`
export const consumerDir = `${artifacts}/consumers`

export const PACKAGES = [
  { name: '@your-scope/theme', dir: 'packages/theme' },
  { name: '@your-scope/ui', dir: 'packages/ui' },
] as const

export interface RunOptions {
  cwd?: string
  /** Print the command's output only when it fails. Default true. */
  quiet?: boolean
  env?: Readonly<Record<string, string>>
}

/** Run a command, throwing (with its output) when it exits non-zero. */
export const run = (command: string, args: readonly string[], options: RunOptions = {}): string => {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
    maxBuffer: 64 * 1024 * 1024,
  })
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
  if (result.status !== 0) {
    throw new Error(`\`${command} ${args.join(' ')}\` failed (exit ${result.status ?? 'signal'})\n${output}`)
  }
  if (options.quiet === false) process.stdout.write(output)
  return output
}

export const kib = (bytes: number): string => `${(bytes / 1024).toFixed(2)} KiB`

export const gzipSize = (content: string | Uint8Array): number => gzipSync(content, { level: 9 }).length

export const gzipSizeOfFiles = async (
  directory: string,
  extension: string,
): Promise<{ raw: number; gzip: number; files: number }> => {
  let raw = 0
  let gzip = 0
  let files = 0
  for (const entry of await readdir(directory, { recursive: true })) {
    if (!entry.endsWith(extension)) continue
    const content = await readFile(`${directory}/${entry}`)
    raw += content.length
    gzip += gzipSize(content)
    files++
  }
  return { raw, gzip, files }
}

export interface PackedPackage {
  name: string
  version: string
  tarball: string
}

/**
 * `pnpm pack` every publishable package into .artifacts/packages. This is
 * exactly what `pnpm publish` would upload (workspace: ranges resolved,
 * `files` applied, LICENSE added).
 */
export const packPackages = async (): Promise<PackedPackage[]> => {
  await rm(tarballDir, { recursive: true, force: true })
  await mkdir(tarballDir, { recursive: true })
  const packed: PackedPackage[] = []
  for (const { name, dir } of PACKAGES) {
    if (!existsSync(`${root}${dir}/dist`)) {
      throw new Error(`${dir}/dist is missing. Run \`pnpm build\` first.`)
    }
    run('pnpm', ['pack', '--pack-destination', tarballDir], { cwd: `${root}${dir}` })
    const manifest = JSON.parse(await readFile(`${root}${dir}/package.json`, 'utf8')) as { version: string }
    const file = `${name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`
    const tarball = `${tarballDir}/${file}`
    if (!existsSync(tarball)) throw new Error(`expected ${tarball} after packing ${name}`)
    packed.push({ name, version: manifest.version, tarball })
  }
  return packed
}

/** File list of a tarball (paths without the leading `package/`). */
export const tarballFiles = (tarball: string): string[] =>
  run('tar', ['-tzf', tarball])
    .split('\n')
    .filter(Boolean)
    .map((entry) => entry.replace(/^package\//, ''))

export const tarballFile = (tarball: string, path: string): string =>
  run('tar', ['-xzOf', tarball, `package/${path}`])
