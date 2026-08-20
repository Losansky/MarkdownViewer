/**
 * Path helpers usable from main and renderer (no Node-only APIs).
 */

export function fileName(path: string): string {
  const i = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
  return i >= 0 ? path.slice(i + 1) : path
}

/** `notes.md` → `notes.pdf`; missing path → `document.pdf`. */
export function pdfExportFileName(filePath: string | null | undefined): string {
  if (!filePath) return 'document.pdf'
  const name = fileName(filePath)
  const dot = name.lastIndexOf('.')
  const stem = dot > 0 ? name.slice(0, dot) : name
  return `${stem || 'document'}.pdf`
}

export function dirname(filePath: string): string {
  const i = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
  return i <= 0 ? filePath : filePath.slice(0, i)
}

export function normalizePathKey(path: string): string {
  const normalized = path.replace(/\\/g, '/')
  const isWin = /^[a-zA-Z]:[/\\]/.test(path) || path.includes('\\')
  return isWin ? normalized.toLowerCase() : normalized
}

export function pathsEqual(a: string, b: string): boolean {
  return normalizePathKey(a) === normalizePathKey(b)
}

export function decodeHref(href: string): string {
  try {
    return decodeURIComponent(href)
  } catch {
    return href
  }
}

/** Split `path#hash` without treating `#` inside a URL scheme as a path. */
export function splitHash(href: string): { pathPart: string; hash: string | null } {
  const hashIdx = href.indexOf('#')
  if (hashIdx === -1) return { pathPart: href, hash: null }
  return {
    pathPart: href.slice(0, hashIdx),
    hash: href.slice(hashIdx)
  }
}

/** Resolve a relative href against a markdown file path (string-only, cross-platform). */
export function resolveRelativePath(fromFile: string, href: string): string {
  let raw = decodeHref(href.trim())
  const q = raw.indexOf('?')
  if (q >= 0) raw = raw.slice(0, q)

  if (/^file:/i.test(raw)) {
    return raw.replace(/^file:\/+/, '').replace(/\//g, '\\')
  }

  if (/^[a-zA-Z]:[\\/]/.test(raw) || raw.startsWith('\\\\')) {
    return raw
  }

  if (raw.startsWith('/') && !/^[a-zA-Z]:/.test(fromFile)) {
    return raw
  }

  const base = dirname(fromFile)
  const sep = fromFile.includes('\\') ? '\\' : '/'
  const joined = `${base}${sep}${raw}`
  return joined.replace(/[/\\]+/g, sep)
}

export function toFileUrl(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/')
  if (/^[a-zA-Z]:/.test(normalized)) {
    return `file:///${encodeURI(normalized).replace(/#/g, '%23')}`
  }
  if (normalized.startsWith('//')) {
    return `file:${encodeURI(normalized)}`
  }
  return `file://${encodeURI(normalized)}`
}
