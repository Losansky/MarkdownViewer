import { existsSync } from 'fs'
import { normalize, resolve as pathResolve, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { BrowserWindow, dialog, shell } from 'electron'
import type { FileService } from './fileService'
import type { OpenLinkResult } from '../shared/types'
import {
  isAllowedExternalHref,
  isDangerousHref,
  isMarkdownPath,
  isOsOpenablePath
} from './security'
import { splitHash } from '../shared/linkResolve'

export type { OpenLinkResult }

function decodeHref(href: string): string {
  try {
    return decodeURIComponent(href)
  } catch {
    return href
  }
}

function isExternalHref(href: string): boolean {
  return isAllowedExternalHref(href)
}

/**
 * Resolve a markdown href relative to the document that contains the link.
 */
export function resolveLocalHref(fromFile: string, href: string): string {
  let raw = decodeHref(href.trim())
  const q = raw.indexOf('?')
  if (q >= 0) raw = raw.slice(0, q)

  if (/^file:/i.test(raw)) {
    try {
      return normalize(fileURLToPath(raw))
    } catch {
      // fall through
    }
  }

  if (/^[a-zA-Z]:[\\/]/.test(raw) || raw.startsWith('\\\\')) {
    return normalize(raw)
  }

  if (raw.startsWith('/') && !/^[a-zA-Z]:/.test(fromFile)) {
    return normalize(raw)
  }

  const baseDir = dirname(fromFile)
  return normalize(pathResolve(baseDir, raw))
}

export async function openMarkdownLink(
  fileService: FileService,
  fromFile: string | null,
  href: string,
  parent?: BrowserWindow | null
): Promise<OpenLinkResult> {
  const trimmed = (href || '').trim()
  if (!trimmed || trimmed === '#') {
    return { kind: 'error', message: 'Empty link.' }
  }

  if (isDangerousHref(trimmed)) {
    return { kind: 'error', message: `Blocked link scheme: ${trimmed.split(':', 1)[0]}` }
  }

  if (isExternalHref(trimmed)) {
    const url = trimmed.startsWith('//') ? `https:${trimmed}` : trimmed
    try {
      await shell.openExternal(url)
      return { kind: 'external', ok: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { kind: 'external', ok: false, message }
    }
  }

  const { pathPart, hash } = splitHash(trimmed)

  if (!pathPart) {
    return { kind: 'anchor', hash: hash ?? '' }
  }

  if (!fromFile) {
    return {
      kind: 'error',
      message: 'Cannot resolve a relative link without an open document.'
    }
  }

  const target = resolveLocalHref(fromFile, pathPart)

  if (!existsSync(target)) {
    return {
      kind: 'file',
      ok: false,
      path: target,
      hash,
      message: `File not found: ${target}`
    }
  }

  if (isMarkdownPath(target)) {
    const opened = fileService.openPath(target)
    if (!opened) {
      return {
        kind: 'file',
        ok: false,
        path: target,
        hash,
        message: `Could not open: ${target}`
      }
    }
    return { kind: 'file', ok: true, path: target, hash }
  }

  if (!isOsOpenablePath(target)) {
    return {
      kind: 'file',
      ok: false,
      path: target,
      hash,
      message: `Blocked opening of this file type: ${target}`
    }
  }

  const confirmed = await confirmOsOpen(target, parent)
  if (!confirmed) {
    return { kind: 'cancelled' }
  }

  const err = await shell.openPath(target)
  if (err) {
    return { kind: 'file', ok: false, path: target, hash, message: err }
  }
  return { kind: 'file', ok: true, path: target, hash }
}

async function confirmOsOpen(
  target: string,
  parent?: BrowserWindow | null
): Promise<boolean> {
  const options: Electron.MessageBoxOptions = {
    type: 'warning',
    buttons: ['Open', 'Cancel'],
    defaultId: 1,
    cancelId: 1,
    title: 'Open file',
    message: 'Open this file with the system default app?',
    detail: target
  }
  const result = parent
    ? await dialog.showMessageBox(parent, options)
    : await dialog.showMessageBox(options)
  return result.response === 0
}

export function toFileUrl(filePath: string): string {
  return pathToFileURL(filePath).href
}


