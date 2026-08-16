import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron'
import { existsSync } from 'fs'
import { basename, join } from 'path'
import { ConfigService } from './configService'
import { FileService } from './fileService'
import { RecentService } from './recentService'
import {
  openInExternalEditor,
  resolveDefaultEditor
} from './editorService'
import { openMarkdownLink } from './linkService'
import { getAboutInfo } from './aboutService'
import type {
  OpenedFilePayload,
  FileErrorPayload,
  PresentationConfig,
  OpenedFolderPayload,
  AppCommand,
  RecentList,
  ThemeName,
  OpenEditorResult,
  EditorsConfig,
  OpenLinkResult,
  SearchHit,
  AboutInfo
} from '../shared/types'

let mainWindow: BrowserWindow | null = null
let configService: ConfigService
let fileService: FileService
let recentService: RecentService

const DARK_BG = '#0d1117'
const LIGHT_BG = '#ffffff'

function themeBackground(theme: ThemeName): string {
  return theme === 'dark' ? DARK_BG : LIGHT_BG
}

function applyWindowTheme(theme: ThemeName): void {
  mainWindow?.setBackgroundColor(themeBackground(theme))
}

function getEditors(): EditorsConfig {
  return configService.getConfig().editors
}

function resolveWindowIcon(): string | undefined {
  const candidates = [
    join(process.resourcesPath, 'icon.ico'),
    join(app.getAppPath(), 'build', 'icon.ico'),
    join(process.cwd(), 'build', 'icon.ico'),
    join(__dirname, '../../build/icon.ico')
  ]
  for (const path of candidates) {
    if (existsSync(path)) return path
  }
  return undefined
}

function createWindow(): void {
  const theme = configService.getConfig().presentation.theme
  const icon = resolveWindowIcon()
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 720,
    minHeight: 480,
    show: false,
    title: 'MarkDown Viewer',
    backgroundColor: themeBackground(theme),
    ...(icon ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Never open new BrowserWindows; external http(s) only
    if (url.startsWith('http:') || url.startsWith('https:')) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  // Keep the viewer document stable: never navigate the renderer to link targets.
  // Relative .md links are handled in the preview click handler instead.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    event.preventDefault()
    if (url.startsWith('http:') || url.startsWith('https:')) {
      void shell.openExternal(url)
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function sendToRenderer(channel: string, payload: unknown): void {
  mainWindow?.webContents.send(channel, payload)
}

function sendCommand(command: AppCommand): void {
  sendToRenderer('app:command', command)
}

function recentMenuLabel(path: string): string {
  const name = basename(path) || path
  if (name.length >= path.length) return path
  return `${name}  —  ${path}`
}

async function openEditorForPath(
  filePath: string,
  editorId?: string | null
): Promise<OpenEditorResult> {
  const result = await openInExternalEditor(filePath, getEditors(), editorId)
  if (!result.ok && result.message) {
    sendToRenderer('file:error', { path: filePath, message: result.message })
  }
  return result
}

function buildOpenRecentSubmenu(): Electron.MenuItemConstructorOptions[] {
  const list = recentService.pruneMissing()
  const items: Electron.MenuItemConstructorOptions[] = []

  if (list.files.length === 0 && list.folders.length === 0) {
    items.push({ label: 'No recent items', enabled: false })
  } else {
    if (list.files.length > 0) {
      items.push({ label: 'Files', enabled: false })
      for (const filePath of list.files) {
        items.push({
          label: recentMenuLabel(filePath),
          click: () => {
            const result = fileService.openPath(filePath)
            if (!result) {
              recentService.remove(filePath)
            }
          }
        })
      }
    }
    if (list.folders.length > 0) {
      if (list.files.length > 0) {
        items.push({ type: 'separator' })
      }
      items.push({ label: 'Folders', enabled: false })
      for (const folderPath of list.folders) {
        items.push({
          label: recentMenuLabel(folderPath),
          click: () => {
            const result = fileService.openFolder(folderPath)
            if (!result) {
              recentService.remove(folderPath)
            }
          }
        })
      }
    }
  }

  items.push({ type: 'separator' })
  items.push({
    label: 'Clear Recent',
    enabled: list.files.length > 0 || list.folders.length > 0,
    click: () => {
      recentService.clear()
    }
  })

  return items
}

function buildOpenWithSubmenu(
  filePath: string | null
): Electron.MenuItemConstructorOptions[] {
  const editors = getEditors()
  const enabled = Boolean(filePath)
  const items: Electron.MenuItemConstructorOptions[] = []

  if (editors.list.length === 0) {
    items.push({
      label: 'System default…',
      enabled,
      click: () => {
        if (filePath) void openEditorForPath(filePath, 'system')
      }
    })
    return items
  }

  for (const editor of editors.list) {
    const isDefault = editor.id === editors.default ||
      (!editors.list.some((e) => e.id === editors.default) &&
        editor.id === editors.list[0]?.id)
    items.push({
      label: isDefault ? `${editor.name} (default)` : editor.name,
      enabled,
      click: () => {
        if (filePath) void openEditorForPath(filePath, editor.id)
      }
    })
  }

  items.push({ type: 'separator' })
  items.push({
    label: 'System default…',
    enabled,
    click: () => {
      if (filePath) void openEditorForPath(filePath, 'system')
    }
  })

  return items
}

function buildFileContextMenu(filePath: string): Electron.Menu {
  const editors = getEditors()
  const defaultEditor = resolveDefaultEditor(editors)
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Open',
      click: () => {
        fileService.openPath(filePath)
      }
    }
  ]

  if (defaultEditor) {
    template.push({
      label: `Open in ${defaultEditor.name}`,
      click: () => {
        void openEditorForPath(filePath, defaultEditor.id)
      }
    })
  } else {
    template.push({
      label: 'Open in External Editor',
      click: () => {
        void openEditorForPath(filePath, 'system')
      }
    })
  }

  // Offer other configured editors when more than one is listed
  if (editors.list.length > 1) {
    const others = editors.list.filter((e) => e.id !== defaultEditor?.id)
    if (others.length > 0) {
      template.push({
        label: 'Open with',
        submenu: others.map((editor) => ({
          label: editor.name,
          click: () => {
            void openEditorForPath(filePath, editor.id)
          }
        }))
      })
    }
  }

  if (editors.list.length > 0) {
    template.push({
      label: 'Open with System default…',
      click: () => {
        void openEditorForPath(filePath, 'system')
      }
    })
  }

  template.push({ type: 'separator' })
  template.push({
    label: 'Reveal in File Explorer',
    click: () => {
      shell.showItemInFolder(filePath)
    }
  })

  return Menu.buildFromTemplate(template)
}

function buildMenu(): void {
  const isMac = process.platform === 'darwin'
  const activePath = fileService?.getLastActivePath() ?? null
  const hasActiveFile = Boolean(activePath)
  const theme = configService.getConfig().presentation.theme
  const defaultEditor = resolveDefaultEditor(getEditors())

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File…',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            void fileService.openWithDialog()
          }
        },
        {
          label: 'Open Folder…',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => {
            void fileService.openFolderWithDialog()
          }
        },
        {
          label: 'Open Recent',
          submenu: buildOpenRecentSubmenu()
        },
        { type: 'separator' },
        {
          label: defaultEditor
            ? `Open in ${defaultEditor.name}`
            : 'Open in External Editor',
          accelerator: 'CmdOrCtrl+E',
          enabled: hasActiveFile,
          click: () => {
            const path = fileService.getLastActivePath()
            if (path) {
              void openEditorForPath(path, defaultEditor?.id ?? 'system')
            }
          }
        },
        {
          label: 'Open with',
          submenu: buildOpenWithSubmenu(activePath)
        },
        { type: 'separator' },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            fileService.reload()
          }
        },
        {
          label: 'Refresh Folder',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            sendCommand('refresh-folder')
          }
        },
        { type: 'separator' },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            sendCommand('close-tab')
          }
        },
        {
          label: 'Close All Tabs',
          accelerator: 'CmdOrCtrl+Shift+W',
          click: () => {
            sendCommand('close-all-tabs')
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Find…',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            sendCommand('find')
          }
        },
        {
          label: 'Find in Open Files',
          accelerator: 'CmdOrCtrl+Shift+F',
          click: () => {
            sendCommand('find-in-open-files')
          }
        },
        {
          label: 'Find in Folder',
          accelerator: 'CmdOrCtrl+Shift+G',
          click: () => {
            sendCommand('find-in-folder')
          }
        },
        {
          label: 'Find Next',
          accelerator: 'F3',
          click: () => {
            sendCommand('find-next')
          }
        },
        {
          label: 'Find Previous',
          accelerator: 'Shift+F3',
          click: () => {
            sendCommand('find-previous')
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            sendCommand('toggle-sidebar')
          }
        },
        { type: 'separator' },
        {
          label: 'Theme',
          submenu: [
            {
              label: 'Light',
              type: 'radio',
              checked: theme === 'light',
              click: () => {
                configService.setTheme('light')
              }
            },
            {
              label: 'Dark',
              type: 'radio',
              checked: theme === 'dark',
              click: () => {
                configService.setTheme('dark')
              }
            },
            { type: 'separator' },
            {
              label: 'Toggle Light/Dark',
              accelerator: 'CmdOrCtrl+Shift+D',
              click: () => {
                const next =
                  configService.getConfig().presentation.theme === 'dark'
                    ? 'light'
                    : 'dark'
                configService.setTheme(next)
              }
            }
          ]
        },
        { type: 'separator' },
        { role: 'toggleDevTools', visible: !app.isPackaged },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Open presentation config…',
          click: () => {
            configService.ensureUserConfig()
            shell.showItemInFolder(configService.getUserConfigPath())
          }
        },
        { type: 'separator' },
        {
          label: 'About MarkDown Viewer',
          click: () => {
            sendCommand('about')
          }
        }
      ]
    }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function isTrustedSender(event: Electron.IpcMainInvokeEvent): boolean {
  return Boolean(
    mainWindow &&
      !mainWindow.isDestroyed() &&
      event.sender.id === mainWindow.webContents.id
  )
}

function registerIpc(): void {
  ipcMain.handle('file:open', async (event) => {
    if (!isTrustedSender(event)) return null
    return fileService.openWithDialog()
  })

  ipcMain.handle('folder:open', async (event) => {
    if (!isTrustedSender(event)) return null
    return fileService.openFolderWithDialog()
  })

  ipcMain.handle('file:openPath', async (event, filePath: string) => {
    if (!isTrustedSender(event)) return null
    if (typeof filePath !== 'string' || !filePath) return null
    const result = fileService.openPath(filePath)
    if (!result) {
      recentService.remove(filePath)
    }
    return result
  })

  ipcMain.handle('file:reload', async (event, filePath?: string) => {
    if (!isTrustedSender(event)) return null
    return fileService.reload(typeof filePath === 'string' ? filePath : undefined)
  })

  ipcMain.handle('file:close', async (event, filePath: string) => {
    if (!isTrustedSender(event)) return
    if (typeof filePath === 'string' && filePath) {
      fileService.closePath(filePath)
    }
  })

  ipcMain.handle('file:setActive', async (event, filePath: string | null) => {
    if (!isTrustedSender(event)) return
    fileService.setActivePath(typeof filePath === 'string' ? filePath : null)
    buildMenu()
  })

  ipcMain.handle('folder:refresh', async (event, rootPath: string) => {
    if (!isTrustedSender(event)) return null
    if (typeof rootPath !== 'string' || !rootPath) return null
    return fileService.openFolder(rootPath)
  })

  ipcMain.handle(
    'file:openLink',
    async (event, fromFile: string | null, href: string): Promise<OpenLinkResult> => {
      if (!isTrustedSender(event)) {
        return { kind: 'error', message: 'Untrusted sender.' }
      }
      const from =
        typeof fromFile === 'string' && fromFile
          ? fromFile
          : fileService.getLastActivePath()
      return openMarkdownLink(
        fileService,
        from,
        typeof href === 'string' ? href : '',
        mainWindow
      )
    }
  )

  ipcMain.handle('config:get', async (event): Promise<PresentationConfig> => {
    if (!isTrustedSender(event)) return configService.getConfig()
    return configService.getConfig()
  })

  ipcMain.handle('config:getPath', async (event): Promise<string> => {
    if (!isTrustedSender(event)) return ''
    return configService.getUserConfigPath()
  })

  ipcMain.handle('config:setTheme', async (event, theme: ThemeName) => {
    if (!isTrustedSender(event)) return configService.getConfig()
    if (theme !== 'light' && theme !== 'dark') {
      return configService.getConfig()
    }
    return configService.setTheme(theme)
  })

  ipcMain.handle('recents:get', async (event): Promise<RecentList> => {
    if (!isTrustedSender(event)) return { files: [], folders: [] }
    return recentService.pruneMissing()
  })

  ipcMain.handle('recents:clear', async (event): Promise<RecentList> => {
    if (!isTrustedSender(event)) return { files: [], folders: [] }
    recentService.clear()
    return recentService.getList()
  })

  ipcMain.handle(
    'editor:open',
    async (event, filePath: string, editorId?: string | null): Promise<OpenEditorResult> => {
      if (!isTrustedSender(event)) {
        return { ok: false, message: 'Untrusted sender.' }
      }
      if (typeof filePath !== 'string' || !filePath) {
        return { ok: false, message: 'No file path provided.' }
      }
      return openEditorForPath(filePath, editorId)
    }
  )

  ipcMain.handle('file:contextMenu', async (event, filePath: string) => {
    if (!isTrustedSender(event)) return
    if (typeof filePath !== 'string' || !filePath) return
    const win = BrowserWindow.fromWebContents(event.sender)
    const menu = buildFileContextMenu(filePath)
    await new Promise<void>((resolve) => {
      menu.popup({
        window: win ?? undefined,
        callback: () => resolve()
      })
    })
  })

  ipcMain.handle(
    'search:folder',
    async (event, rootPath: string, query: string): Promise<SearchHit[]> => {
      if (!isTrustedSender(event)) return []
      if (typeof rootPath !== 'string' || !rootPath) return []
      if (typeof query !== 'string' || !query.trim()) return []
      return fileService.searchFolder(rootPath, query)
    }
  )

  ipcMain.handle('app:about', async (event): Promise<AboutInfo> => {
    if (!isTrustedSender(event)) {
      return { name: '', version: '', electron: '', chrome: '', node: '', sbom: null }
    }
    return getAboutInfo()
  })
}

app.whenReady().then(() => {
  configService = new ConfigService()
  configService.ensureUserConfig()
  configService.setOnChange((config) => {
    applyWindowTheme(config.presentation.theme)
    buildMenu()
    sendToRenderer('config:updated', config)
  })
  configService.startWatching()

  recentService = new RecentService()
  recentService.setOnChange((list) => {
    buildMenu()
    sendToRenderer('recents:updated', list)
  })

  fileService = new FileService(
    () => mainWindow,
    (payload: OpenedFilePayload) => {
      recentService.addFile(payload.path)
      buildMenu()
      sendToRenderer('file:opened', payload)
    },
    (payload: FileErrorPayload) => sendToRenderer('file:error', payload),
    (payload: OpenedFolderPayload) => {
      recentService.addFolder(payload.rootPath)
      sendToRenderer('folder:opened', payload)
    }
  )

  registerIpc()
  buildMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  fileService?.dispose()
  configService?.stopWatching()
  if (process.platform !== 'darwin') app.quit()
})
