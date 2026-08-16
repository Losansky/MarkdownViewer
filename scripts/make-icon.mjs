/**
 * Convert a source image into build/icon.png and multi-size build/icon.ico
 * Usage: node scripts/make-icon.mjs [source-image-path]
 */
import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source =
  process.argv[2] ??
  join(
    process.env.USERPROFILE ?? '',
    '.grok/sessions/C%3A%5CUsers%5Cterry%5COneDrive%5CDocuments%5CGrok%5CMarkDownViewer/019fd429-d855-7e20-a9b0-3a14022787b3/images/1.jpg'
  )
const outDir = join(root, 'build')
const sizes = [16, 24, 32, 48, 64, 128, 256]

if (!existsSync(source)) {
  console.error(`Source image not found: ${source}`)
  process.exit(1)
}

mkdirSync(outDir, { recursive: true })

const png512 = join(outDir, 'icon.png')
await sharp(source).resize(512, 512, { fit: 'cover' }).png().toFile(png512)

const buffers = []
for (const size of sizes) {
  buffers.push(await sharp(source).resize(size, size, { fit: 'cover' }).png().toBuffer())
}

const ico = await pngToIco(buffers)
const icoPath = join(outDir, 'icon.ico')
writeFileSync(icoPath, ico)

console.log(`Wrote ${resolve(png512)}`)
console.log(`Wrote ${resolve(icoPath)} (${sizes.join(', ')} px)`)
