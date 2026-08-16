import { spawn, type SpawnOptions } from 'child_process'
import { existsSync } from 'fs'
import { isAbsolute, normalize } from 'path'
import { shell } from 'electron'
import type { EditorEntry, EditorsConfig } from '../shared/types'

export interface OpenEditorResult {
  ok: boolean
  message?: string
}

function substituteArgs(args: string[] | undefined, filePath: string): string[] {
  const list = args && args.length > 0 ? args : ['{{file}}']
  return list.map((arg) => arg.split('{{file}}').join(filePath))
}

export function resolveDefaultEditor(editors: EditorsConfig): EditorEntry | null {
  if (!editors.list.length) return null
  const byId = editors.list.find((e) => e.id === editors.default)
  return byId ?? editors.list[0] ?? null
}

export function resolveEditor(editors: EditorsConfig, editorId?: string | null): EditorEntry | null {
  if (editorId) {
    return editors.list.find((e) => e.id === editorId) ?? null
  }
  return resolveDefaultEditor(editors)
}

/**
 * Absolute / path-like commands must not use shell:true on Windows —
 * cmd.exe splits on spaces ("C:\Program Files\...").
 * Bare names (code, cursor) still need shell so .cmd shims on PATH resolve.
 */
function resolveSpawnTarget(command: string): {
  command: string
  useShell: boolean
} {
  const trimmed = command.trim().replace(/^["']|["']$/g, '')
  const looksLikePath =
    isAbsolute(trimmed) ||
    trimmed.includes('/') ||
    trimmed.includes('\\') ||
    /^[a-zA-Z]:/.test(trimmed)

  if (looksLikePath) {
    const normalized = normalize(trimmed)
    return { command: normalized, useShell: false }
  }

  // PATH-based tools (code, cursor, subl, …)
  return { command: trimmed, useShell: process.platform === 'win32' }
}

function spawnEditor(command: string, args: string[], useShell: boolean): Promise<OpenEditorResult> {
  const options: SpawnOptions = {
    detached: true,
    stdio: 'ignore',
    shell: useShell,
    windowsHide: true
  }

  return new Promise((resolve) => {
    let settled = false
    const finish = (result: OpenEditorResult): void => {
      if (settled) return
      settled = true
      resolve(result)
    }

    let child
    try {
      child = spawn(command, args, options)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      finish({ ok: false, message: `Could not start editor: ${message}` })
      return
    }

    child.on('error', (err) => {
      finish({
        ok: false,
        message: `Could not start "${command}": ${err.message}`
      })
    })

    // 'spawn' fires once the process has been successfully started
    child.once('spawn', () => {
      child.unref()
      finish({ ok: true })
    })

    // Fallback if neither spawn nor error fires promptly (some platforms)
    setTimeout(() => {
      if (!settled) {
        try {
          child.unref()
        } catch {
          // ignore
        }
        finish({ ok: true })
      }
    }, 1500)
  })
}

/**
 * Open a file in a configured external editor, or the OS default association
 * when no editors are configured / editorId is "system".
 */
export async function openInExternalEditor(
  filePath: string,
  editors: EditorsConfig,
  editorId?: string | null
): Promise<OpenEditorResult> {
  if (!filePath || !existsSync(filePath)) {
    return { ok: false, message: `File not found: ${filePath || '(empty)'}` }
  }

  // Explicit system association, or empty list → OS default
  if (editorId === 'system' || editors.list.length === 0) {
    const err = await shell.openPath(filePath)
    if (err) {
      return { ok: false, message: err }
    }
    return { ok: true }
  }

  const editor = resolveEditor(editors, editorId)
  if (!editor) {
    return {
      ok: false,
      message: editorId
        ? `Unknown editor id: ${editorId}`
        : 'No default editor configured. Add editors in presentation.json.'
    }
  }

  if (!editor.command?.trim()) {
    return { ok: false, message: `Editor "${editor.name}" has an empty command.` }
  }

  const { command, useShell } = resolveSpawnTarget(editor.command)

  if (!useShell && !existsSync(command)) {
    return {
      ok: false,
      message: `Editor executable not found: ${command}`
    }
  }

  const args = substituteArgs(editor.args, filePath)
  const result = await spawnEditor(command, args, useShell)
  if (!result.ok && result.message) {
    return {
      ok: false,
      message: `${editor.name}: ${result.message}`
    }
  }
  return result
}
