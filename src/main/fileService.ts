import { BrowserWindow, dialog } from 'electron'
import {
  readFileSync,
  readdirSync,
  watch,
  existsSync,
  statSync,
  type FSWatcher,
  type Dirent
} from 'fs'
import { basename, join, extname } from 'path'
import type {
  OpenedFilePayload,
  FileErrorPayload,
  TreeNode,
  OpenedFolderPayload,
  SearchHit
} from '../shared/types'
import { MARKDOWN_EXTENSIONS, isMarkdownPath } from './security'
const SEARCH_MAX_HITS = 500
const SEARCH_MAX_FILE_BYTES = 2 * 1024 * 1024

const MARKDOWN_FILTERS = [
  { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd'] },
  { name: 'All Files', extensions: ['*'] }
]

function isMarkdownFile(fileName: string): boolean {
  return MARKDOWN_EXTENSIONS.has(extname(fileName).toLowerCase())
}

function sortTreeNodes(a: TreeNode, b: TreeNode): number {
  if (a.type !== b.type) {
    return a.type === 'directory' ? -1 : 1
  }
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

/** Build a tree of directories that contain Markdown files (and the files themselves). */
export function buildMarkdownTree(rootPath: string): TreeNode | null {
  if (!existsSync(rootPath)) return null

  let rootStat
  try {
    rootStat = statSync(rootPath)
  } catch {
    return null
  }

  if (!rootStat.isDirectory()) return null

  const children = walkMarkdownTree(rootPath)
  return {
    name: basename(rootPath) || rootPath,
    path: rootPath,
    type: 'directory',
    children
  }
}

function walkMarkdownTree(dirPath: string): TreeNode[] {
  let entries: Dirent[]
  try {
    entries = readdirSync(dirPath, { withFileTypes: true })
  } catch {
    return []
  }

  const nodes: TreeNode[] = []

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    if (entry.name === 'node_modules' || entry.name === 'out' || entry.name === 'dist') continue

    const fullPath = join(dirPath, entry.name)

    if (entry.isDirectory()) {
      const childNodes = walkMarkdownTree(fullPath)
      if (childNodes.length > 0) {
        nodes.push({
          name: entry.name,
          path: fullPath,
          type: 'directory',
          children: childNodes
        })
      }
    } else if (entry.isFile() && isMarkdownFile(entry.name)) {
      nodes.push({
        name: entry.name,
        path: fullPath,
        type: 'file'
      })
    }
  }

  nodes.sort(sortTreeNodes)
  return nodes
}

export class FileService {
  private watchers = new Map<string, FSWatcher>()
  private debouncers = new Map<string, NodeJS.Timeout>()
  private lastActivePath: string | null = null
  /** Currently open explorer folder root (watched for tree refresh). */
  private folderRoot: string | null = null
  /** Path the folder watcher is actually attached to. */
  private folderWatchPath: string | null = null
  private folderWatcher: FSWatcher | null = null
  private folderDebounce: NodeJS.Timeout | null = null

  constructor(
    private getWindow: () => BrowserWindow | null,
    private onOpened: (payload: OpenedFilePayload) => void,
    private onError: (payload: FileErrorPayload) => void,
    private onFolder: (payload: OpenedFolderPayload) => void
  ) {}

  getLastActivePath(): string | null {
    return this.lastActivePath
  }

  getFolderRoot(): string | null {
    return this.folderRoot
  }

  async openWithDialog(): Promise<OpenedFilePayload | null> {
    const win = this.getWindow()
    const options: Electron.OpenDialogOptions = {
      title: 'Open Markdown file',
      properties: ['openFile'],
      filters: MARKDOWN_FILTERS
    }
    const result = win
      ? await dialog.showOpenDialog(win, options)
      : await dialog.showOpenDialog(options)

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return this.openPath(result.filePaths[0])
  }

  async openFolderWithDialog(): Promise<OpenedFolderPayload | null> {
    const win = this.getWindow()
    const options: Electron.OpenDialogOptions = {
      title: 'Open folder',
      properties: ['openDirectory']
    }
    const result = win
      ? await dialog.showOpenDialog(win, options)
      : await dialog.showOpenDialog(options)

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return this.openFolder(result.filePaths[0])
  }

  openFolder(rootPath: string): OpenedFolderPayload | null {
    try {
      if (!existsSync(rootPath)) {
        this.onError({ path: rootPath, message: `Folder not found: ${rootPath}` })
        return null
      }
      const tree = buildMarkdownTree(rootPath)
      if (!tree) {
        this.onError({ path: rootPath, message: `Could not read folder: ${rootPath}` })
        return null
      }
      const payload = { rootPath, tree }
      this.folderRoot = rootPath
      this.watchFolder(rootPath)
      this.onFolder(payload)
      return payload
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      this.onError({ path: rootPath, message: `Could not open folder: ${message}` })
      return null
    }
  }

  /** Rebuild tree for the open folder without re-prompting the user. */
  refreshOpenFolder(): OpenedFolderPayload | null {
    if (!this.folderRoot) return null
    return this.openFolder(this.folderRoot)
  }

  openPath(filePath: string): OpenedFilePayload | null {
    try {
      if (!isMarkdownPath(filePath)) {
        this.onError({ path: filePath, message: `Not a Markdown file: ${filePath}` })
        return null
      }
      if (!existsSync(filePath)) {
        this.onError({ path: filePath, message: `File not found: ${filePath}` })
        return null
      }
      const content = readFileSync(filePath, 'utf-8')
      this.lastActivePath = filePath
      this.watchPath(filePath)
      const payload = { path: filePath, content }
      this.onOpened(payload)
      return payload
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      this.onError({ path: filePath, message: `Could not read file: ${message}` })
      return null
    }
  }

  reload(filePath?: string): OpenedFilePayload | null {
    const target = filePath ?? this.lastActivePath
    if (!target) {
      this.onError({ message: 'No file is open to reload.' })
      return null
    }
    return this.openPath(target)
  }

  closePath(filePath: string): void {
    this.stopWatch(filePath)
    if (this.lastActivePath === filePath) {
      this.lastActivePath = null
    }
  }

  setActivePath(filePath: string | null): void {
    this.lastActivePath = filePath
  }

  searchFolder(rootPath: string, query: string): SearchHit[] {
    const q = query.trim()
    if (!q || !rootPath || !existsSync(rootPath)) return []
    const tree = buildMarkdownTree(rootPath)
    if (!tree) return []
    const files = collectMarkdownFiles(tree)
    const hits: SearchHit[] = []
    for (const filePath of files) {
      try {
        const stat = statSync(filePath)
        if (!stat.isFile() || stat.size > SEARCH_MAX_FILE_BYTES) continue
        const content = readFileSync(filePath, 'utf-8')
        collectTextHits(filePath, content, q, hits)
        if (hits.length >= SEARCH_MAX_HITS) break
      } catch {
        // Skip unreadable files
      }
    }
    return hits
  }

  dispose(): void {
    for (const path of [...this.watchers.keys()]) {
      this.stopWatch(path)
    }
    this.stopFolderWatch()
  }

  private watchPath(filePath: string): void {
    if (this.watchers.has(filePath)) return

    try {
      const watcher = watch(filePath, { persistent: false }, (eventType) => {
        if (eventType !== 'change' && eventType !== 'rename') return
        const existing = this.debouncers.get(filePath)
        if (existing) clearTimeout(existing)
        const timer = setTimeout(() => {
          this.debouncers.delete(filePath)
          if (this.watchers.has(filePath)) {
            // Silent reload — do not re-notify as a new open if read fails
            try {
              if (!existsSync(filePath)) return
              const content = readFileSync(filePath, 'utf-8')
              this.onOpened({ path: filePath, content })
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err)
              this.onError({ path: filePath, message: `Could not reload file: ${message}` })
            }
          }
        }, 150)
        this.debouncers.set(filePath, timer)
      })
      this.watchers.set(filePath, watcher)
    } catch (err) {
      console.warn('Could not watch file:', err)
    }
  }

  private stopWatch(filePath: string): void {
    const timer = this.debouncers.get(filePath)
    if (timer) {
      clearTimeout(timer)
      this.debouncers.delete(filePath)
    }
    const watcher = this.watchers.get(filePath)
    if (watcher) {
      watcher.close()
      this.watchers.delete(filePath)
    }
  }

  /**
   * Watch the explorer root for add/remove/rename so the tree stays current.
   * Uses recursive watch (supported on Windows/macOS; best-effort on Linux).
   */
  private watchFolder(rootPath: string): void {
    if (this.folderWatcher && this.folderWatchPath === rootPath) {
      // Already watching this root
      return
    }
    this.stopFolderWatch()
    this.folderRoot = rootPath
    this.folderWatchPath = rootPath

    try {
      this.folderWatcher = watch(
        rootPath,
        { persistent: false, recursive: true },
        () => {
          if (this.folderDebounce) clearTimeout(this.folderDebounce)
          this.folderDebounce = setTimeout(() => {
            this.folderDebounce = null
            this.refreshFolderQuietly()
          }, 250)
        }
      )
      this.folderWatcher.on('error', (err) => {
        console.warn('Folder watcher error:', err)
      })
    } catch (err) {
      console.warn('Could not watch folder:', err)
      this.folderWatchPath = null
    }
  }

  private stopFolderWatch(): void {
    if (this.folderDebounce) {
      clearTimeout(this.folderDebounce)
      this.folderDebounce = null
    }
    if (this.folderWatcher) {
      this.folderWatcher.close()
      this.folderWatcher = null
    }
    this.folderWatchPath = null
  }

  /** Rebuild and push tree without restarting the watcher (avoids thrash). */
  private refreshFolderQuietly(): void {
    const rootPath = this.folderRoot
    if (!rootPath) return
    try {
      if (!existsSync(rootPath)) {
        this.onError({ path: rootPath, message: `Folder no longer exists: ${rootPath}` })
        this.stopFolderWatch()
        this.folderRoot = null
        return
      }
      const tree = buildMarkdownTree(rootPath)
      if (!tree) return
      this.onFolder({ rootPath, tree })
    } catch (err) {
      console.warn('Folder refresh failed:', err)
    }
  }
}

function collectMarkdownFiles(node: TreeNode, into: string[] = []): string[] {
  if (node.type === 'file') into.push(node.path)
  for (const child of node.children ?? []) {
    collectMarkdownFiles(child, into)
  }
  return into
}

function collectTextHits(
  path: string,
  content: string,
  query: string,
  into: SearchHit[]
): void {
  const lowerQuery = query.toLowerCase()
  const lines = content.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lower = line.toLowerCase()
    let start = 0
    while (start < line.length) {
      const idx = lower.indexOf(lowerQuery, start)
      if (idx === -1) break
      into.push({
        path,
        line: i + 1,
        column: idx + 1,
        length: query.length,
        snippet: makeSnippet(line, idx, query.length)
      })
      if (into.length >= SEARCH_MAX_HITS) return
      start = idx + query.length
    }
  }
}

function makeSnippet(line: string, index: number, length: number): string {
  const pad = 36
  const start = Math.max(0, index - pad)
  const end = Math.min(line.length, index + length + pad)
  let snippet = line.slice(start, end).replace(/\s+/g, ' ')
  if (start > 0) snippet = `…${snippet}`
  if (end < line.length) snippet = `${snippet}…`
  return snippet
}
