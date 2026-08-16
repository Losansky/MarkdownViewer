import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import type { RecentList } from '../shared/types'

const MAX_RECENT = 12

function emptyList(): RecentList {
  return { files: [], folders: [] }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

export class RecentService {
  private list: RecentList = emptyList()
  private storePath: string
  private onChange: ((list: RecentList) => void) | null = null

  constructor() {
    this.storePath = join(app.getPath('userData'), 'recent.json')
    this.list = this.load()
  }

  getList(): RecentList {
    return {
      files: [...this.list.files],
      folders: [...this.list.folders]
    }
  }

  setOnChange(handler: (list: RecentList) => void): void {
    this.onChange = handler
  }

  /** Push a file path to the front of the recent files list. */
  addFile(filePath: string): void {
    if (!filePath) return
    this.list.files = promote(this.list.files, filePath, MAX_RECENT)
    this.persist()
  }

  /** Push a folder path to the front of the recent folders list. */
  addFolder(folderPath: string): void {
    if (!folderPath) return
    this.list.folders = promote(this.list.folders, folderPath, MAX_RECENT)
    this.persist()
  }

  /** Drop paths that no longer exist on disk (called when building menus / UI). */
  pruneMissing(): RecentList {
    const files = this.list.files.filter((p) => existsSync(p))
    const folders = this.list.folders.filter((p) => existsSync(p))
    const changed =
      files.length !== this.list.files.length || folders.length !== this.list.folders.length
    if (changed) {
      this.list = { files, folders }
      this.persist()
    }
    return this.getList()
  }

  remove(path: string): void {
    const nextFiles = this.list.files.filter((p) => p !== path)
    const nextFolders = this.list.folders.filter((p) => p !== path)
    if (
      nextFiles.length === this.list.files.length &&
      nextFolders.length === this.list.folders.length
    ) {
      return
    }
    this.list = { files: nextFiles, folders: nextFolders }
    this.persist()
  }

  clear(): void {
    this.list = emptyList()
    this.persist()
  }

  private persist(): void {
    try {
      const dir = dirname(this.storePath)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      writeFileSync(this.storePath, JSON.stringify(this.list, null, 2), 'utf-8')
    } catch (err) {
      console.warn('Could not save recent.json:', err)
    }
    this.onChange?.(this.getList())
  }

  private load(): RecentList {
    if (!existsSync(this.storePath)) {
      return emptyList()
    }
    try {
      const raw = JSON.parse(readFileSync(this.storePath, 'utf-8')) as unknown
      if (!raw || typeof raw !== 'object') return emptyList()
      const obj = raw as Record<string, unknown>
      return {
        files: isStringArray(obj.files) ? obj.files.slice(0, MAX_RECENT) : [],
        folders: isStringArray(obj.folders) ? obj.folders.slice(0, MAX_RECENT) : []
      }
    } catch (err) {
      console.warn('Invalid recent.json; starting empty:', err)
      return emptyList()
    }
  }
}

function promote(list: string[], path: string, max: number): string[] {
  const filtered = list.filter((p) => p !== path)
  return [path, ...filtered].slice(0, max)
}
