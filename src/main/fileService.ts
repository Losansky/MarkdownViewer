import { BrowserWindow, dialog } from 'electron'
import { readFileSync, watch, existsSync, statSync, type FSWatcher } from 'fs'
import { readFile } from 'fs/promises'
import type {
  OpenedFilePayload,
  FileErrorPayload,
  TreeNode,
  OpenedFolderPayload,
  SearchHit,
  FindOptions
} from '../shared/types'
import { isMarkdownPath } from './security'
import { buildMarkdownTree } from './markdownTree'
import { collectTextHits, SEARCH_MAX_HITS } from '../shared/search'

export { buildMarkdownTree }

const SEARCH_MAX_FILE_BYTES = 2 * 1024 * 1024

const MARKDOWN_FILTERS = [
  { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd'] },
  { name: 'All Files', extensions: ['*'] }
]

export class FileService {
  private watchers = new Map<string, FSWatcher>()
  private debouncers = new Map<string, NodeJS.Timeout>()
  private lastActivePath: string | null = null
  private folderRoot: string | null = null
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

  async searchFolder(
    rootPath: string,
    query: string,
    options?: FindOptions
  ): Promise<SearchHit[]> {
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
        const content = await readFile(filePath, 'utf-8')
        collectTextHits(filePath, content, q, hits, options)
        if (hits.length >= SEARCH_MAX_HITS) break
        await yieldToEventLoop()
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

  private watchFolder(rootPath: string): void {
    if (this.folderWatcher && this.folderWatchPath === rootPath) return
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

function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve))
}
