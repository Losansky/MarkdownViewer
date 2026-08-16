import { app } from 'electron'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { AboutInfo, SbomDocument } from '../shared/types'

function resolveSbomPath(): string | null {
  const candidates = [
    join(process.resourcesPath, 'sbom.json'),
    join(app.getAppPath(), 'build', 'sbom.json'),
    join(process.cwd(), 'build', 'sbom.json'),
    join(__dirname, '../../build/sbom.json')
  ]
  for (const path of candidates) {
    if (existsSync(path)) return path
  }
  return null
}

function loadSbom(): SbomDocument | null {
  const path = resolveSbomPath()
  if (!path) return null
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8')) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as SbomDocument
  } catch (err) {
    console.warn('Could not read SBOM:', err)
    return null
  }
}

export function getAboutInfo(): AboutInfo {
  return {
    name: app.getName() || 'MarkDown Viewer',
    version: app.getVersion(),
    electron: process.versions.electron ?? '',
    chrome: process.versions.chrome ?? '',
    node: process.versions.node ?? '',
    sbom: loadSbom()
  }
}
