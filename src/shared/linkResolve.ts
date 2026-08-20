import { decodeHref, resolveRelativePath, splitHash } from './pathUtils'

export { splitHash }

/** Resolve a markdown href relative to the document that contains the link. */
export function resolveLocalHref(fromFile: string, href: string): string {
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

  return resolveRelativePath(fromFile, raw)
}
