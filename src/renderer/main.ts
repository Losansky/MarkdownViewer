import './styles/preview.css'
import 'katex/dist/katex.min.css'
import type { PresentationConfig, AppCommand, RecentList } from '../shared/types'
import { PreviewController } from './ui/preview'
import { TabManager, type TabState } from './ui/tabs'
import { TreeView } from './ui/tree'
import { hasRecents, renderRecentsPanel } from './ui/recents'
import { FindBar } from './ui/findBar'
import { SidebarSplitter } from './ui/splitter'
import { AboutDialog } from './ui/aboutDialog'

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

let preview: PreviewController
let tabs: TabManager
let tree: TreeView
let findBar: FindBar
let aboutDialog: AboutDialog
let folderRoot: string | null = null
let recents: RecentList = { files: [], folders: [] }
let config: PresentationConfig
/** Applied after the next preview render (in-doc link with #heading). */
let pendingScrollHash: string | null = null

function setDocumentTitle(path: string | null): void {
  if (!path) {
    document.title = 'MarkDown Viewer'
    return
  }
  const name = path.split(/[/\\]/).pop() ?? path
  document.title = `${name} — MarkDown Viewer`
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

  if (!folderRoot) {
    renderRecentsPanel(sidebarEmptyEl, recents, {
      variant: 'sidebar',
      onOpenFile: openFile,
      onOpenFolder: openFolder,
      onClear: hasRecents(recents) ? clear : undefined
    })
  }

  const welcomeTitle = document.createElement('h1')
  welcomeTitle.className = 'welcome-title'
  welcomeTitle.textContent = 'MarkDown Viewer'

  const welcomeBody = document.createElement('div')
  welcomeBody.className = 'welcome-body'
  renderRecentsPanel(welcomeBody, recents, {
    variant: 'welcome',
    onOpenFile: openFile,
    onOpenFolder: openFolder,
    onClear: hasRecents(recents) ? clear : undefined
  })

  const actions = document.createElement('div')
  actions.className = 'welcome-actions'
  const openFileBtn = document.createElement('button')
  openFileBtn.type = 'button'
  openFileBtn.className = 'welcome-btn primary'
  openFileBtn.textContent = 'Open File…'
  openFileBtn.addEventListener('click', () => void handleCommand('open-file'))
  const openFolderBtn = document.createElement('button')
  openFolderBtn.type = 'button'
  openFolderBtn.className = 'welcome-btn'
  openFolderBtn.textContent = 'Open Folder…'
  openFolderBtn.addEventListener('click', () => void handleCommand('open-folder'))
  actions.append(openFileBtn, openFolderBtn)

  welcomeEl.replaceChildren(welcomeTitle, actions, welcomeBody)
  updateWelcomeVisibility()
}

async function activateTab(tab: TabState | null): Promise<void> {
  if (!tab) {
    preview.clear()
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
  const hash = pendingScrollHash
  pendingScrollHash = null
  await preview.open(tab.path, tab.content, hash)
  findBar.onContentChanged()
}

async function openFilePath(path: string): Promise<void> {
  const existing = tabs.getTab(path)
  if (existing) {
    tabs.setActive(path)
    return
  }
  await window.api.openPath(path)
}

/** Handle links in the preview (relative .md, external URLs, #anchors). */
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

  if (result.kind === 'cancelled') {
    return
  }

  if (result.kind === 'external') {
    if (!result.ok && result.message) {
      preview.showError(result.message)
    }
    return
  }

  // kind === 'file'
  if (!result.ok) {
    preview.showError(result.message ?? `Could not open: ${result.path}`)
    return
  }

  // Markdown was opened via main → file:opened during the IPC call.
  // Scroll to #hash after render if the active preview is that file.
  if (result.hash) {
    const tryScroll = (): void => {
      if (preview.getPath() === result.path) {
        preview.scrollToHash(result.hash!)
      } else {
        pendingScrollHash = result.hash
      }
    }
    requestAnimationFrame(tryScroll)
  }
}

function showContextMenuFor(path: string): void {
  void window.api.showFileContextMenu(path)
}

async function openActiveInEditor(): Promise<void> {
  const path = tabs.getActivePath()
  if (!path) {
    preview.showError('No file is open to edit externally.')
    return
  }
  const result = await window.api.openInEditor(path)
  if (!result.ok && result.message) {
    preview.showError(result.message)
  }
}

async function toggleTheme(): Promise<void> {
  const next = config.presentation.theme === 'dark' ? 'light' : 'dark'
  const updated = await window.api.setTheme(next)
  config = updated
  preview.setConfig(updated)
}

async function handleCommand(command: AppCommand): Promise<void> {
  switch (command) {
    case 'open-file':
      await window.api.openFile()
      break
    case 'open-folder':
      await window.api.openFolder()
      break
    case 'reload': {
      const active = tabs.getActivePath()
      if (active) {
        await window.api.reloadFile(active)
      } else {
        await window.api.reloadFile()
      }
      break
    }
    case 'close-tab': {
      const active = tabs.getActivePath()
      if (active) tabs.close(active)
      break
    }
    case 'close-all-tabs':
      tabs.closeAll()
      break
    case 'refresh-folder':
      if (folderRoot) {
        await window.api.refreshFolder(folderRoot)
      } else {
        await window.api.openFolder()
      }
      break
    case 'toggle-sidebar':
      appEl.classList.toggle('sidebar-collapsed')
      sidebarEl.setAttribute(
        'aria-hidden',
        appEl.classList.contains('sidebar-collapsed') ? 'true' : 'false'
      )
      break
    case 'open-in-editor':
      await openActiveInEditor()
      break
    case 'toggle-theme':
      await toggleTheme()
      break
    case 'find':
      findBar.show('current')
      break
    case 'find-in-open-files':
      findBar.show('open-files')
      break
    case 'find-in-folder':
      findBar.show(folderRoot ? 'folder' : 'current')
      break
    case 'find-next':
      findBar.findNext()
      break
    case 'find-previous':
      findBar.findPrevious()
      break
    case 'about': {
      const info = await window.api.getAbout()
      aboutDialog.show(info)
      break
    }
  }
}

async function init(): Promise<void> {
  config = await window.api.getConfig()
  preview = new PreviewController(previewEl, errorEl, config)
  preview.applyPresentationStyles()
  await preview.loadHighlightTheme()
  preview.clear()
  preview.setOnLinkClick((href) => {
    void handlePreviewLink(href)
  })

  aboutDialog = new AboutDialog()

  new SidebarSplitter(appEl, sidebarEl, splitterEl)

  tabs = new TabManager(
    tabBarEl,
    (tab) => {
      void activateTab(tab)
    },
    (path) => {
      void window.api.closePath(path)
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
    getFolderRoot: () => folderRoot,
    searchFolder: async (query) => {
      if (!folderRoot) return []
      return window.api.searchFolder(folderRoot, query)
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

  // Context menu on preview when a document is open
  previewEl.addEventListener('contextmenu', (e) => {
    const path = tabs.getActivePath()
    if (!path) return
    e.preventDefault()
    showContextMenuFor(path)
  })

  recents = await window.api.getRecents()
  paintRecents()

  window.api.onRecentsUpdated((list) => {
    recents = list
    paintRecents()
  })

  window.api.onFileOpened(async (payload) => {
    const existing = tabs.getTab(payload.path)
    if (existing) {
      tabs.updateContent(payload.path, payload.content)
      if (tabs.getActivePath() === payload.path) {
        previewEl.hidden = false
        welcomeEl.hidden = true
        const hash = pendingScrollHash
        pendingScrollHash = null
        await preview.open(payload.path, payload.content, hash)
        setDocumentTitle(payload.path)
        tree.setSelected(payload.path)
        await window.api.setActivePath(payload.path)
        findBar.onContentChanged()
      }
      return
    }
    tabs.upsert(payload.path, payload.content, true)
  })

  window.api.onFileError((payload) => {
    preview.showError(payload.message)
  })

  window.api.onConfigUpdated((next) => {
    config = next
    preview.setConfig(next)
    // Config re-render replaces preview DOM; re-apply find highlights if open
    queueMicrotask(() => findBar.onContentChanged())
  })

  window.api.onFolderOpened((payload) => {
    folderRoot = payload.rootPath
    tree.setTree(payload.tree)
    if (tabs.getActivePath()) {
      tree.setSelected(tabs.getActivePath())
    }
    paintRecents()
  })

  window.api.onCommand((command) => {
    void handleCommand(command)
  })

  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase()
    const mod = e.ctrlKey || e.metaKey

    // Find shortcuts (also when focus is outside the find input)
    if (mod && key === 'f' && e.shiftKey && !e.altKey) {
      e.preventDefault()
      void handleCommand('find-in-open-files')
      return
    }
    if (mod && key === 'f' && !e.shiftKey && !e.altKey) {
      e.preventDefault()
      void handleCommand('find')
      return
    }
    if (mod && key === 'g' && e.shiftKey && !e.altKey) {
      e.preventDefault()
      void handleCommand('find-in-folder')
      return
    }
    if (key === 'f3' || (mod && key === 'g' && !e.altKey)) {
      e.preventDefault()
      void handleCommand(e.shiftKey ? 'find-previous' : 'find-next')
      return
    }
    if (e.key === 'Escape' && aboutDialog.isOpen()) {
      e.preventDefault()
      aboutDialog.hide()
      return
    }
    if (e.key === 'Escape' && findBar.isOpen()) {
      // Let the find input handle Escape when focused; otherwise close here
      if (document.activeElement?.id !== 'find-input') {
        e.preventDefault()
        findBar.hide()
      }
      return
    }

    if (!mod) return

    if (key === 'o' && e.shiftKey) {
      e.preventDefault()
      void handleCommand('open-folder')
    } else if (key === 'o') {
      e.preventDefault()
      void handleCommand('open-file')
    } else if (key === 'w' && e.shiftKey) {
      e.preventDefault()
      void handleCommand('close-all-tabs')
    } else if (key === 'w') {
      e.preventDefault()
      void handleCommand('close-tab')
    } else if (key === 'b') {
      e.preventDefault()
      void handleCommand('toggle-sidebar')
    } else if (key === 'r' && e.shiftKey) {
      e.preventDefault()
      void handleCommand('refresh-folder')
    } else if (key === 'e') {
      e.preventDefault()
      void handleCommand('open-in-editor')
    } else if (key === 'd' && e.shiftKey) {
      e.preventDefault()
      void handleCommand('toggle-theme')
    }
  })
}

void init()
