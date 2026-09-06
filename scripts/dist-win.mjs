/**
 * Run electron-builder for Windows. If the project lives under OneDrive,
 * write artifacts to %TEMP% first (NSIS fails when the uninstaller file
 * is not fully flushed to a synced folder), then copy the exes back.
 */
import { spawnSync } from 'child_process'
import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync } from 'fs'
import { join, basename } from 'path'
import { tmpdir } from 'os'

/** NSIS stubs from a failed pack are ~0.6 MB; real Setup/portable builds are ~100 MB+. */
const MIN_EXE_BYTES = 40 * 1024 * 1024

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

assertCompleteExes(outDir)

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
  assertCompleteExes(releaseDir)
}

function assertCompleteExes(dir) {
  const exes = readdirSync(dir).filter(
    (name) => name.endsWith('.exe') && !/uninstaller/i.test(name)
  )
  const setup = exes.filter((name) => /setup/i.test(name))
  const portable = exes.filter((name) => !/setup/i.test(name))
  if (setup.length < 1 || portable.length < 1) {
    console.error(
      `Incomplete Windows build in ${dir}: setup=${setup.join(', ') || '(none)'} portable=${portable.join(', ') || '(none)'}`
    )
    process.exit(1)
  }
  for (const name of exes) {
    const size = statSync(join(dir, name)).size
    console.log(`${name}: ${(size / (1024 * 1024)).toFixed(1)} MB`)
    if (size < MIN_EXE_BYTES) {
      console.error(
        `Stub or truncated artifact: ${name} is ${size} bytes (need at least ${MIN_EXE_BYTES})`
      )
      process.exit(1)
    }
  }
}
