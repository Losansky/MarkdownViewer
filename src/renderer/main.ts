import './styles/preview.css'
import 'katex/dist/katex.min.css'
import type { PresentationConfig, ConfigStatus } from '../shared/types'
import { fileName } from '../shared/pathUtils'
import { PreviewController } from './ui/preview'
import { TabManager, type TabState } from './ui/tabs'
import { TreeView } from './ui/tree'
import { hasRecents, renderRecentsPanel } from './ui/recents'
import { FindBar } from './ui/findBar'
import { SidebarSplitter } from './ui/splitter'
import { AboutDialog } from './ui/aboutDialog'
import { TocPanel } from './ui/toc'
import { AppState } from './app/state'
import { dispatchCommand } from './app/commands'
import { bindKeyboardShortcuts } from './app/shortcuts'
import { bindFileDrop } from './app/drop'
import type { AppContext } from './app/context'

const appEl = document.getElementById('app') as HTMLElement
const sidebarEl = document.getElementById('sidebar') as HTMLElement
const splitterEl = document.getElementById('splitter') as HTMLElement
const treeEl = document.getElementById('tree') as HTMLElement
const sidebarEmptyEl = document.getElementById('sidebar-empty') as HTMLElement
const sidebarTitleEl = document.getElementById('sidebar-title') as HTMLElement
const sidebarRootEl = document.getElementById('sidebar-root') as HTMLElement
const treeExpandToggleEl = document.getElementById('tree-expand-toggle') as HTMLButtonElement
const tabBarEl = document.getElementById('tab-bar') as HTMLElement
const mainEl = document.getElementById('main') as HTMLElement
const previewEl = document.getElementById('preview') as HTMLElement
const welcomeEl = document.getElementById('welcome') as HTMLElement
const errorEl = document.getElementById('error-banner') as HTMLElement
const tocEl = document.getElementById('toc') as HTMLElement
const tocListEl = document.getElementById('toc-list') as HTMLElement

const state = new AppState()
let preview: PreviewController
let tabs: TabManager
let tree: TreeView
let findBar: FindBar
let toc: TocPanel
let aboutDialog: AboutDialog
let ctx: AppContext

function setDocumentTitle(path: string | null): void {
  if (!path) {
    document.title = 'MarkDown Viewer'
    return
  }
  document.title = `${fileName(path)} — MarkDown Viewer`
}

function updateWelcomeVisibility(): void {
  const showWelcome = !tabs.getActivePath()
  welcomeEl.hidden = !showWelcome
  if (showWelcome) {
    previewEl.hidden = true
    previewEl.classList.remove('has-content')
  } else {
    previewEl.hidden = false
  }
}

function paintRecents(): void {
  const openFile = (path: string): void => {
    void openFilePath(path)
  }
  const openFolder = (path: string): void => {
    void window.api.refreshFolder(path)
  }
  const clear = (): void => {
    void window.api.clearRecents()
  }

  if (!state.folderRoot) {
    renderRecentsPanel(sidebarEmptyEl, state.recents, {
      variant: 'sidebar',
      onOpenFile: openFile,
      onOpenFolder: openFolder,
      onClear: hasRecents(state.recents) ? clear : undefined
    })
  }

  const welcomeTitle = document.createElement('h1')
  welcomeTitle.className = 'welcome-title'
  welcomeTitle.textContent = 'MarkDown Viewer'

  const welcomeBody = document.createElement('div')
  welcomeBody.className = 'welcome-body'
  renderRecentsPanel(welcomeBody, state.recents, {
    variant: 'welcome',
    onOpenFile: openFile,
    onOpenFolder: openFolder,
    onClear: hasRecents(state.recents) ? clear : undefined
  })

  const actions = document.createElement('div')
  actions.className = 'welcome-actions'
  const openFileBtn = document.createElement('button')
  openFileBtn.type = 'button'
  openFileBtn.className = 'welcome-btn primary'
  openFileBtn.textContent = 'Open File…'
  openFileBtn.addEventListener('click', () => void dispatchCommand(ctx, 'open-file'))
  const openFolderBtn = document.createElement('button')
  openFolderBtn.type = 'button'
  openFolderBtn.className = 'welcome-btn'
  openFolderBtn.textContent = 'Open Folder…'
  openFolderBtn.addEventListener('click', () => void dispatchCommand(ctx, 'open-folder'))
  actions.append(openFileBtn, openFolderBtn)

  welcomeEl.replaceChildren(welcomeTitle, actions, welcomeBody)
  updateWelcomeVisibility()
}

function persistSession(): void {
  void window.api.saveSession({
    tabs: tabs.getTabs().map((tab) => tab.path),
    activePath: tabs.getActivePath(),
    folderRoot: state.folderRoot,
    tocVisible: state.tocVisible
  })
}

function applyConfig(next: PresentationConfig, warning?: string | null): void {
  state.config = next
  preview.setConfig(next)
  if (warning) preview.showError(warning)
}

async function toggleTheme(): Promise<void> {
  const next = state.config.presentation.theme === 'dark' ? 'light' : 'dark'
  applyConfig(await window.api.setTheme(next))
}

async function openActiveInEditor(): Promise<void> {
  const path = tabs.getActivePath()
  if (!path) {
    preview.showError('No file is open to edit externally.')
    return
  }
  const result = await window.api.openInEditor(path)
  if (!result.ok && result.message) preview.showError(result.message)
}

async function activateTab(tab: TabState | null): Promise<void> {
  if (!tab) {
    preview.clear()
    toc.setSource(null)
    setDocumentTitle(null)
    tree.setSelected(null)
    await window.api.setActivePath(null)
    updateWelcomeVisibility()
    findBar.onContentChanged()
    return
  }

  previewEl.hidden = false
  welcomeEl.hidden = true
  tree.setSelected(tab.path)
  setDocumentTitle(tab.path)
  await window.api.setActivePath(tab.path)
  const hash = state.pendingScrollHash
  state.pendingScrollHash = null
  await preview.open(tab.path, tab.content, hash)
  toc.setSource(tab.content)
  findBar.onContentChanged()
  persistSession()
}

async function openFilePath(path: string): Promise<void> {
  const existing = tabs.getTab(path)
  if (existing) {
    tabs.setActive(path)
    return
  }
  await window.api.openPath(path)
}

async function handlePreviewLink(href: string): Promise<void> {
  const fromFile = tabs.getActivePath() ?? preview.getPath()
  const result = await window.api.openLink(fromFile, href)

  if (result.kind === 'anchor') {
    preview.scrollToHash(result.hash)
    return
  }
  if (result.kind === 'error') {
    preview.showError(result.message)
    return
  }
  if (result.kind === 'cancelled') return
  if (result.kind === 'external') {
    if (!result.ok && result.message) preview.showError(result.message)
    return
  }
  if (!result.ok) {
    preview.showError(result.message ?? `Could not open: ${result.path}`)
    return
  }
  if (result.hash) {
    const tryScroll = (): void => {
      if (preview.getPath() === result.path) {
        preview.scrollToHash(result.hash!)
      } else {
        state.pendingScrollHash = result.hash
      }
    }
    requestAnimationFrame(tryScroll)
  }
}

function showContextMenuFor(path: string): void {
  void window.api.showFileContextMenu(path)
}

async function init(): Promise<void> {
  const status = await window.api.getConfig()
  state.config = status.config
  preview = new PreviewController(previewEl, errorEl, state.config)
  preview.applyPresentationStyles()
  await preview.loadHighlightTheme()
  preview.clear()
  if (status.warning) preview.showError(status.warning)
  preview.setOnLinkClick((href) => {
    void handlePreviewLink(href)
  })

  aboutDialog = new AboutDialog()
  toc = new TocPanel(tocEl, tocListEl)
  toc.setOnNavigate((id) => preview.scrollToHash(id))

  new SidebarSplitter(appEl, sidebarEl, splitterEl)

  tabs = new TabManager(
    tabBarEl,
    (tab) => {
      void activateTab(tab)
    },
    (path) => {
      void window.api.closePath(path)
      persistSession()
    }
  )
  tabs.setOnContextMenu(showContextMenuFor)

  findBar = new FindBar(mainEl, {
    getPreviewRoot: () => {
      if (previewEl.hidden || !previewEl.classList.contains('has-content')) return null
      return previewEl
    },
    getOpenDocuments: () =>
      tabs.getTabs().map((tab) => ({
        path: tab.path,
        name: tab.name,
        content: tab.content
      })),
    getFolderRoot: () => state.folderRoot,
    searchFolder: async (query, options) => {
      if (!state.folderRoot) return []
      return window.api.searchFolder(state.folderRoot, query, options)
    },
    openPath: (path) => openFilePath(path)
  })

  tree = new TreeView(
    treeEl,
    sidebarEmptyEl,
    sidebarTitleEl,
    sidebarRootEl,
    (path) => {
      void openFilePath(path)
    },
    treeExpandToggleEl
  )
  tree.setOnContextMenu(showContextMenuFor)
  tree.setTree(null)

  ctx = {
    appEl,
    sidebarEl,
    preview,
    tabs,
    tree,
    findBar,
    toc,
    aboutDialog,
    state,
    applyConfig,
    persistSession,
    toggleTheme,
    openActiveInEditor
  }

  previewEl.addEventListener('contextmenu', (e) => {
    const path = tabs.getActivePath()
    if (!path) return
    e.preventDefault()
    showContextMenuFor(path)
  })

  bindFileDrop(appEl, {
    openFile: openFilePath,
    openFolder: async (path) => {
      await window.api.refreshFolder(path)
    },
    pathKind: (path) => window.api.pathKind(path)
  })

  bindKeyboardShortcuts(ctx, (command) => {
    void dispatchCommand(ctx, command)
  })

  state.recents = await window.api.getRecents()
  paintRecents()

  window.api.onRecentsUpdated((list) => {
    state.recents = list
    paintRecents()
  })

  window.api.onFileOpened(async (payload) => {
    const existing = tabs.getTab(payload.path)
    if (existing) {
      tabs.updateContent(payload.path, payload.content)
      if (tabs.getActivePath() === payload.path) {
        previewEl.hidden = false
        welcomeEl.hidden = true
        const hash = state.pendingScrollHash
        state.pendingScrollHash = null
        await preview.open(payload.path, payload.content, hash)
        toc.setSource(payload.content)
        setDocumentTitle(payload.path)
        tree.setSelected(payload.path)
        await window.api.setActivePath(payload.path)
        findBar.onContentChanged()
      }
      return
    }
    tabs.upsert(payload.path, payload.content, true)
    persistSession()
  })

  window.api.onFileError((payload) => {
    preview.showError(payload.message)
  })

  window.api.onConfigUpdated((next: ConfigStatus) => {
    applyConfig(next.config, next.warning)
    queueMicrotask(() => findBar.onContentChanged())
  })

  window.api.onFolderOpened((payload) => {
    state.folderRoot = payload.rootPath
    tree.setTree(payload.tree)
    if (tabs.getActivePath()) {
      tree.setSelected(tabs.getActivePath())
    }
    paintRecents()
    persistSession()
  })

  window.api.onCommand((command) => {
    void dispatchCommand(ctx, command)
  })

  const session = await window.api.getSession()
  if (session.tocVisible) {
    state.tocVisible = true
    toc.setVisible(true)
  }
  if (session.folderRoot) {
    await window.api.refreshFolder(session.folderRoot)
  }
  for (const filePath of session.tabs) {
    await window.api.openPath(filePath)
  }
  if (session.activePath && tabs.getTab(session.activePath)) {
    tabs.setActive(session.activePath)
  }
}

void init()
