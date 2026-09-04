/**
 * Run electron-builder for Windows. If the project lives under OneDrive,
 * write artifacts to %TEMP% first (NSIS fails when the uninstaller file
 * is not fully flushed to a synced folder), then copy the exes back.
 */
import { spawnSync } from 'child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'fs'
import { join, basename } from 'path'
import { tmpdir } from 'os'

const root = process.cwd()
const releaseDir = join(root, 'release')
const onOneDrive = /onedrive/i.test(root)
const outDir = onOneDrive ? join(tmpdir(), 'mdv-electron-release') : releaseDir

if (onOneDrive) {
  console.log(`OneDrive project path detected; building to ${outDir}`)
  mkdirSync(outDir, { recursive: true })
}

const args = ['electron-builder', '--win', '--publish', 'never']
if (onOneDrive) {
  args.push(`--config.directories.output=${outDir}`)
}

const result = spawnSync('npx', args, {
  cwd: root,
  stdio: 'inherit',
  shell: true
})
if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

if (onOneDrive) {
  mkdirSync(releaseDir, { recursive: true })
  for (const name of readdirSync(outDir)) {
    if (!name.endsWith('.exe') && !name.endsWith('.blockmap')) continue
    if (/uninstaller/i.test(name)) continue
    const src = join(outDir, name)
    const dest = join(releaseDir, basename(name))
    copyFileSync(src, dest)
    console.log(`Copied ${name} -> release/`)
  }
  rmSync(outDir, { recursive: true, force: true })
}
