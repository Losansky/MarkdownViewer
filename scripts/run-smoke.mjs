import { build } from 'esbuild'
import { rmSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outfile = join(root, 'scripts', '.smoke-bundle.mjs')

await build({
  absWorkingDir: root,
  entryPoints: [join(root, 'scripts/smoke-entry.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile,
  external: ['mermaid']
})

try {
  await import(pathToFileURL(outfile).href)
} finally {
  rmSync(outfile, { force: true })
}
