/**
 * Build a CycloneDX 1.6 SBOM for shipped runtime packages + Electron.
 * Walks the production dependency graph in package-lock.json.
 */
import { randomUUID } from 'crypto'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const lockPath = join(root, 'package-lock.json')
const pkgPath = join(root, 'package.json')
const outPath = join(root, 'build', 'sbom.json')

const lock = JSON.parse(readFileSync(lockPath, 'utf-8'))
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
const packages = lock.packages ?? {}
const rootPkg = packages[''] ?? {}

function parentKey(key) {
  const idx = key.lastIndexOf('/node_modules/')
  if (idx === -1) return ''
  return key.slice(0, idx)
}

function resolveDep(fromKey, name) {
  let key = fromKey
  while (true) {
    const candidate = key ? `${key}/node_modules/${name}` : `node_modules/${name}`
    if (packages[candidate]) return candidate
    if (!key) return null
    key = parentKey(key)
  }
}

function collectProductionKeys() {
  const keys = new Set()
  const queue = []
  for (const name of Object.keys(rootPkg.dependencies ?? {})) {
    const resolved = resolveDep('', name)
    if (resolved) queue.push(resolved)
  }
  while (queue.length > 0) {
    const key = queue.shift()
    if (!key || keys.has(key)) continue
    keys.add(key)
    const entry = packages[key]
    if (!entry) continue
    for (const name of Object.keys(entry.dependencies ?? {})) {
      const resolved = resolveDep(key, name)
      if (resolved && !keys.has(resolved)) queue.push(resolved)
    }
  }
  return keys
}

function licenseEntries(license) {
  if (!license) return undefined
  if (typeof license !== 'string') return undefined
  const trimmed = license.trim()
  if (!trimmed) return undefined
  if (/^[A-Za-z0-9.+-]+$/.test(trimmed)) {
    return [{ license: { id: trimmed } }]
  }
  if (/\s(AND|OR|WITH)\s/.test(trimmed)) {
    return [{ expression: trimmed }]
  }
  return [{ license: { name: trimmed } }]
}

function packageNameFromKey(key) {
  const marker = 'node_modules/'
  const idx = key.lastIndexOf(marker)
  return idx === -1 ? key : key.slice(idx + marker.length)
}

function readInstalledLicense(key, fallback) {
  if (fallback) return fallback
  const pkgJson = join(root, key, 'package.json')
  if (!existsSync(pkgJson)) return undefined
  try {
    const installed = JSON.parse(readFileSync(pkgJson, 'utf-8'))
    return installed.license
  } catch {
    return undefined
  }
}

function componentFromKey(key) {
  const entry = packages[key]
  if (!entry?.version) return null
  const name = packageNameFromKey(key)
  const version = entry.version
  const license = readInstalledLicense(key, entry.license)
  const purl = `pkg:npm/${name}@${version}`
  const component = {
    type: 'library',
    'bom-ref': purl,
    name,
    version,
    purl
  }
  const licenses = licenseEntries(license)
  if (licenses) component.licenses = licenses
  if (entry.resolved) {
    component.externalReferences = [{ type: 'distribution', url: entry.resolved }]
  }
  return component
}

function electronComponent() {
  const key = 'node_modules/electron'
  const entry = packages[key]
  const version = entry?.version ?? String(pkg.devDependencies?.electron ?? '').replace(/^\^/, '')
  if (!version) return null
  const license = readInstalledLicense(key, entry?.license) ?? 'MIT'
  const purl = `pkg:npm/electron@${version}`
  return {
    type: 'framework',
    'bom-ref': purl,
    name: 'electron',
    version,
    purl,
    licenses: licenseEntries(license),
    description: 'Shipped application runtime (Electron)'
  }
}

const components = []
const seenPurls = new Set()
for (const key of [...collectProductionKeys()].sort()) {
  const component = componentFromKey(key)
  if (!component || seenPurls.has(component.purl)) continue
  seenPurls.add(component.purl)
  components.push(component)
}

const electron = electronComponent()
if (electron && !seenPurls.has(electron.purl)) {
  components.unshift(electron)
}

const bom = {
  $schema: 'http://cyclonedx.org/schema/bom-1.6.schema.json',
  bomFormat: 'CycloneDX',
  specVersion: '1.6',
  serialNumber: `urn:uuid:${randomUUID()}`,
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    component: {
      type: 'application',
      'bom-ref': `pkg:generic/${pkg.name}@${pkg.version}`,
      name: pkg.name,
      version: pkg.version,
      licenses: licenseEntries(pkg.license)
    },
    tools: {
      components: [
        {
          type: 'application',
          name: 'markdown-viewer-sbom',
          version: pkg.version
        }
      ]
    }
  },
  components
}

writeFileSync(outPath, `${JSON.stringify(bom, null, 2)}\n`, 'utf-8')
console.log(`Wrote ${outPath} (${components.length} components)`)
