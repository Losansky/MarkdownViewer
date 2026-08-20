import { fileName, pathsEqual } from '../../shared/pathUtils'

export interface TabState {
  path: string
  name: string
  content: string
}

export class TabManager {
  private tabs: TabState[] = []
  private activePath: string | null = null
  private onContextMenu: ((path: string) => void) | null = null

  constructor(
    private tabBarEl: HTMLElement,
    private onActivate: (tab: TabState | null) => void,
    private onClose: (path: string) => void
  ) {}

  setOnContextMenu(handler: ((path: string) => void) | null): void {
    this.onContextMenu = handler
  }

  getActivePath(): string | null {
    return this.activePath
  }

  getTabs(): readonly TabState[] {
    return this.tabs
  }

  getTab(path: string): TabState | undefined {
    return this.tabs.find((t) => pathsEqual(t.path, path))
  }

  upsert(path: string, content: string, activate = true): TabState {
    const existing = this.getTab(path)
    if (existing) {
      existing.content = content
      if (activate) {
        this.setActive(path)
      } else {
        this.render()
      }
      return existing
    }

    const tab: TabState = { path, name: fileName(path), content }
    this.tabs.push(tab)
    if (activate) {
      this.setActive(path)
    } else {
      this.render()
    }
    return tab
  }

  updateContent(path: string, content: string): boolean {
    const tab = this.getTab(path)
    if (!tab) return false
    tab.content = content
    return true
  }

  setActive(path: string | null): void {
    if (path !== null && !this.getTab(path)) return
    this.activePath = path
    this.render()
    const tab = path ? this.getTab(path) ?? null : null
    this.onActivate(tab ?? null)
  }

  close(path: string): void {
    const index = this.tabs.findIndex((t) => pathsEqual(t.path, path))
    if (index === -1) return

    const wasActive = this.activePath !== null && pathsEqual(this.activePath, path)
    this.tabs.splice(index, 1)
    this.onClose(path)

    if (wasActive) {
      const next = this.tabs[index] ?? this.tabs[index - 1] ?? null
      this.activePath = next?.path ?? null
      this.render()
      this.onActivate(next)
    } else {
      this.render()
    }
  }

  closeAll(): void {
    const paths = this.tabs.map((t) => t.path)
    this.tabs = []
    this.activePath = null
    for (const path of paths) {
      this.onClose(path)
    }
    this.render()
    this.onActivate(null)
  }

  private render(): void {
    this.tabBarEl.replaceChildren()
    this.tabBarEl.hidden = this.tabs.length === 0

    for (const tab of this.tabs) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'tab'
      button.setAttribute('role', 'tab')
      button.setAttribute('aria-selected', String(tab.path === this.activePath))
      button.title = tab.path
      if (tab.path === this.activePath) {
        button.classList.add('active')
      }

      const label = document.createElement('span')
      label.className = 'tab-label'
      label.textContent = tab.name

      const close = document.createElement('span')
      close.className = 'tab-close'
      close.setAttribute('role', 'button')
      close.setAttribute('aria-label', `Close ${tab.name}`)
      close.title = 'Close'
      close.textContent = '×'

      close.addEventListener('click', (e) => {
        e.stopPropagation()
        this.close(tab.path)
      })

      button.addEventListener('click', () => {
        this.setActive(tab.path)
      })

      button.addEventListener('auxclick', (e) => {
        if (e.button === 1) {
          e.preventDefault()
          this.close(tab.path)
        }
      })

      button.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.onContextMenu?.(tab.path)
      })

      button.append(label, close)
      this.tabBarEl.append(button)
    }
  }
}
