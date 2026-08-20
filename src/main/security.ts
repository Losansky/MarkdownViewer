import { extname } from 'path'
import type { PresentationConfig } from '../shared/types'

export const MARKDOWN_EXTENSIONS = new Set(['.md', '.markdown', '.mdown', '.mkd'])

const CSS_COLOR =
  /^(#[0-9a-f]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|[a-z]+)$/i

function sanitizeCssColor(color: string, fallback = '#0969da'): string {
  const trimmed = color.trim()
  return CSS_COLOR.test(trimmed) ? trimmed : fallback
}

/** Local files the OS may open after the user confirms. Executables and shortcuts are excluded. */
export const OS_OPEN_EXTENSIONS = new Set([
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.bmp',
  '.svg',
  '.txt',
  '.csv',
  '.json',
  '.mp4',
  '.webm',
  '.mp3',
  '.wav',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx'
])

const UNSAFE_MERGE_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

export function isUnsafeMergeKey(key: string): boolean {
  return UNSAFE_MERGE_KEYS.has(key)
}

export function deepMerge<T extends Record<string, unknown>>(base: T, override: Partial<T>): T {
  const result: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue
    if (isUnsafeMergeKey(key)) continue
    const current = result[key]
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      current !== null &&
      typeof current === 'object' &&
      !Array.isArray(current)
    ) {
      result[key] = deepMerge(
        current as Record<string, unknown>,
        value as Record<string, unknown>
      )
    } else {
      result[key] = value
    }
  }
  return result as T
}

export function isMarkdownPath(filePath: string): boolean {
  return MARKDOWN_EXTENSIONS.has(extname(filePath).toLowerCase())
}

export function isOsOpenablePath(filePath: string): boolean {
  return OS_OPEN_EXTENSIONS.has(extname(filePath).toLowerCase())
}

export function isAllowedExternalHref(href: string): boolean {
  return /^(https?:|mailto:|tel:)/i.test(href) || href.startsWith('//')
}

export function isDangerousHref(href: string): boolean {
  return /^(javascript:|data:|vbscript:|about:|blob:)/i.test(href.trim())
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.min(max, Math.max(min, n))
}

export function clampPresentationConfig(
  config: PresentationConfig,
  options: { allowHtml: boolean }
): PresentationConfig {
  const markdown = {
    ...config.markdown,
    html: options.allowHtml ? Boolean(config.markdown?.html) : false
  }

  const mermaid = { ...config.formats.mermaid }
  if (mermaid.securityLevel !== 'strict' && mermaid.securityLevel !== 'sandbox') {
    mermaid.securityLevel = 'strict'
  }

  const types = { ...config.formats.admonitions.types }
  for (const [name, typeConfig] of Object.entries(types)) {
    types[name] = {
      ...typeConfig,
      color: sanitizeCssColor(typeConfig.color)
    }
  }

  const p = config.presentation
  return {
    ...config,
    presentation: {
      ...p,
      theme: p.theme === 'dark' ? 'dark' : 'light',
      fontSizePx: clampNumber(p.fontSizePx, 16, 10, 48),
      lineHeight: clampNumber(p.lineHeight, 1.6, 1, 3),
      maxWidthPx: clampNumber(p.maxWidthPx, 1100, 320, 4000)
    },
    markdown,
    formats: {
      ...config.formats,
      mermaid,
      admonitions: {
        ...config.formats.admonitions,
        types
      }
    }
  }
}
