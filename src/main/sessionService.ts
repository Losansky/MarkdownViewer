import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import type { SessionState } from '../shared/types'

function emptySession(): SessionState {
  return { tabs: [], activePath: null, folderRoot: null, tocVisible: false }
}

export class SessionService {
  private storePath: string
  private current: SessionState

  constructor() {
    this.storePath = join(app.getPath('userData'), 'session.json')
    this.current = this.readFromDisk()
  }

  get(): SessionState {
    return this.current
  }

  load(): SessionState {
    this.current = this.readFromDisk()
    return this.current
  }

  save(state: SessionState): void {
    this.current = {
      tabs: state.tabs,
      activePath: state.activePath,
      folderRoot: state.folderRoot,
      tocVisible: Boolean(state.tocVisible)
    }
    try {
      const dir = dirname(this.storePath)
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
      writeFileSync(this.storePath, JSON.stringify(this.current, null, 2), 'utf-8')
    } catch (err) {
      console.warn('Could not save session.json:', err)
    }
  }

  private readFromDisk(): SessionState {
    if (!existsSync(this.storePath)) return emptySession()
    try {
      const raw = JSON.parse(readFileSync(this.storePath, 'utf-8')) as unknown
      if (!raw || typeof raw !== 'object') return emptySession()
      const obj = raw as Record<string, unknown>
      const tabs = Array.isArray(obj.tabs)
        ? obj.tabs.filter((p): p is string => typeof p === 'string')
        : []
      const activePath = typeof obj.activePath === 'string' ? obj.activePath : null
      const folderRoot = typeof obj.folderRoot === 'string' ? obj.folderRoot : null
      const tocVisible = Boolean(obj.tocVisible)
      return { tabs, activePath, folderRoot, tocVisible }
    } catch {
      return emptySession()
    }
  }
}
