import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppApi,
  AppCommand,
  OpenedFilePayload,
  FileErrorPayload,
  PresentationConfig,
  OpenedFolderPayload,
  RecentList,
  ThemeName,
  OpenEditorResult,
  OpenLinkResult,
  SearchHit,
  AboutInfo,
  ConfigStatus,
  SessionState,
  FindOptions,
  PathKind,
  ExportPdfResult
} from '../shared/types'

const api: AppApi = {
  openFile: () => ipcRenderer.invoke('file:open') as Promise<OpenedFilePayload | null>,
  openFolder: () => ipcRenderer.invoke('folder:open') as Promise<OpenedFolderPayload | null>,
  openPath: (filePath: string) =>
    ipcRenderer.invoke('file:openPath', filePath) as Promise<OpenedFilePayload | null>,
  reloadFile: (filePath?: string) =>
    ipcRenderer.invoke('file:reload', filePath) as Promise<OpenedFilePayload | null>,
  closePath: (filePath: string) => ipcRenderer.invoke('file:close', filePath) as Promise<void>,
  setActivePath: (filePath: string | null) =>
    ipcRenderer.invoke('file:setActive', filePath) as Promise<void>,
  refreshFolder: (rootPath: string) =>
    ipcRenderer.invoke('folder:refresh', rootPath) as Promise<OpenedFolderPayload | null>,
  openLink: (fromFile, href) =>
    ipcRenderer.invoke('file:openLink', fromFile, href) as Promise<OpenLinkResult>,
  getConfig: () => ipcRenderer.invoke('config:get') as Promise<ConfigStatus>,
  getConfigPath: () => ipcRenderer.invoke('config:getPath') as Promise<string>,
  setTheme: (theme: ThemeName) =>
    ipcRenderer.invoke('config:setTheme', theme) as Promise<PresentationConfig>,
  setLineNumbers: (enabled: boolean) =>
    ipcRenderer.invoke('config:setLineNumbers', enabled) as Promise<PresentationConfig>,
  getRecents: () => ipcRenderer.invoke('recents:get') as Promise<RecentList>,
  clearRecents: () => ipcRenderer.invoke('recents:clear') as Promise<RecentList>,
  getSession: () => ipcRenderer.invoke('session:get') as Promise<SessionState>,
  saveSession: (state: SessionState) => ipcRenderer.invoke('session:save', state) as Promise<void>,
  openInEditor: (filePath: string, editorId?: string | null) =>
    ipcRenderer.invoke('editor:open', filePath, editorId) as Promise<OpenEditorResult>,
  showFileContextMenu: (filePath: string) =>
    ipcRenderer.invoke('file:contextMenu', filePath) as Promise<void>,
  searchFolder: (rootPath: string, query: string, options?: FindOptions) =>
    ipcRenderer.invoke('search:folder', rootPath, query, options) as Promise<SearchHit[]>,
  print: () => ipcRenderer.invoke('app:print') as Promise<void>,
  exportPdf: () => ipcRenderer.invoke('app:exportPdf') as Promise<ExportPdfResult>,
  pathKind: (target: string) => ipcRenderer.invoke('path:kind', target) as Promise<PathKind>,
  getAbout: () => ipcRenderer.invoke('app:about') as Promise<AboutInfo>,
  onFileOpened: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: OpenedFilePayload): void => {
      callback(payload)
    }
    ipcRenderer.on('file:opened', listener)
    return () => ipcRenderer.removeListener('file:opened', listener)
  },
  onFileError: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: FileErrorPayload): void => {
      callback(payload)
    }
    ipcRenderer.on('file:error', listener)
    return () => ipcRenderer.removeListener('file:error', listener)
  },
  onConfigUpdated: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, status: ConfigStatus): void => {
      callback(status)
    }
    ipcRenderer.on('config:updated', listener)
    return () => ipcRenderer.removeListener('config:updated', listener)
  },
  onFolderOpened: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: OpenedFolderPayload): void => {
      callback(payload)
    }
    ipcRenderer.on('folder:opened', listener)
    return () => ipcRenderer.removeListener('folder:opened', listener)
  },
  onRecentsUpdated: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, list: RecentList): void => {
      callback(list)
    }
    ipcRenderer.on('recents:updated', listener)
    return () => ipcRenderer.removeListener('recents:updated', listener)
  },
  onCommand: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, command: AppCommand): void => {
      callback(command)
    }
    ipcRenderer.on('app:command', listener)
    return () => ipcRenderer.removeListener('app:command', listener)
  }
}

contextBridge.exposeInMainWorld('api', api)
