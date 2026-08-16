import type { AboutInfo, SbomDocument } from '../../shared/types'

interface SbomComponent {
  name?: string
  version?: string
  type?: string
  licenses?: Array<{ license?: { id?: string; name?: string }; expression?: string }>
}

export class AboutDialog {
  private open = false
  private readonly overlay: HTMLElement
  private readonly dialog: HTMLElement
  private readonly body: HTMLElement
  private readonly contextMenu: HTMLElement
  private tab: 'packages' | 'json' = 'packages'
  private info: AboutInfo | null = null
  private jsonField: HTMLTextAreaElement | null = null
  private copyBtn: HTMLButtonElement | null = null
  private copyResetTimer: ReturnType<typeof setTimeout> | null = null
  private readonly resizeHandle: HTMLButtonElement
  private resizing = false
  private resizeStartX = 0
  private resizeStartY = 0
  private resizeStartW = 0
  private resizeStartH = 0

  constructor() {
    this.overlay = document.createElement('div')
    this.overlay.id = 'about-overlay'
    this.overlay.hidden = true
    this.overlay.setAttribute('role', 'presentation')

    this.dialog = document.createElement('div')
    this.dialog.id = 'about-dialog'
    this.dialog.setAttribute('role', 'dialog')
    this.dialog.setAttribute('aria-modal', 'true')
    this.dialog.setAttribute('aria-labelledby', 'about-title')

    this.body = document.createElement('div')
    this.body.id = 'about-body'

    this.contextMenu = document.createElement('div')
    this.contextMenu.id = 'about-json-menu'
    this.contextMenu.hidden = true
    this.contextMenu.setAttribute('role', 'menu')
    this.contextMenu.append(
      this.menuItem('Select all', () => this.selectAllJson()),
      this.menuItem('Copy', () => {
        void this.copyJson()
      })
    )

    this.resizeHandle = document.createElement('button')
    this.resizeHandle.type = 'button'
    this.resizeHandle.className = 'about-resize'
    this.resizeHandle.title = 'Resize'
    this.resizeHandle.setAttribute('aria-label', 'Resize About dialog')
    this.resizeHandle.addEventListener('pointerdown', (e) => this.onResizePointerDown(e))

    this.overlay.append(this.dialog)
    document.body.append(this.overlay, this.contextMenu)
    window.addEventListener('pointermove', (e) => this.onResizePointerMove(e))
    window.addEventListener('pointerup', () => this.onResizePointerUp())
    window.addEventListener('pointercancel', () => this.onResizePointerUp())

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.hide()
    })
    this.dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        if (!this.contextMenu.hidden) {
          this.hideContextMenu()
          return
        }
        this.hide()
      }
    })
    document.addEventListener('pointerdown', (e) => {
      if (this.contextMenu.hidden) return
      if (this.contextMenu.contains(e.target as Node)) return
      this.hideContextMenu()
    })
    window.addEventListener('blur', () => this.hideContextMenu())
    window.addEventListener('resize', () => {
      this.hideContextMenu()
      this.clampDialogToViewport()
    })
  }

  isOpen(): boolean {
    return this.open
  }

  show(info: AboutInfo): void {
    this.info = info
    this.open = true
    this.overlay.hidden = false
    this.render()
    const closeBtn = this.dialog.querySelector<HTMLButtonElement>('#about-close')
    closeBtn?.focus()
  }

  hide(): void {
    this.open = false
    this.overlay.hidden = true
    this.hideContextMenu()
  }

  toggle(info: AboutInfo): void {
    if (this.open) this.hide()
    else this.show(info)
  }

  private render(): void {
    const info = this.info
    if (!info) return

    const header = document.createElement('div')
    header.id = 'about-header'

    const title = document.createElement('h1')
    title.id = 'about-title'
    title.textContent = info.name

    const version = document.createElement('p')
    version.className = 'about-version'
    version.textContent = `Version ${info.version}`

    const runtime = document.createElement('p')
    runtime.className = 'about-runtime'
    runtime.textContent = [
      info.electron ? `Electron ${info.electron}` : null,
      info.chrome ? `Chromium ${info.chrome}` : null,
      info.node ? `Node ${info.node}` : null
    ]
      .filter(Boolean)
      .join(' · ')

    const credit = document.createElement('p')
    credit.className = 'about-credit'
    const grok = document.createElement('span')
    grok.textContent = 'Built with Grok'
    const author = document.createElement('span')
    author.textContent = 'Terry Losansky'
    credit.append(grok, document.createElement('br'), author)

    const close = document.createElement('button')
    close.type = 'button'
    close.id = 'about-close'
    close.title = 'Close'
    close.setAttribute('aria-label', 'Close About')
    close.textContent = '×'
    close.addEventListener('click', () => this.hide())

    header.append(title, version, runtime, credit, close)

    const tabs = document.createElement('div')
    tabs.className = 'about-tabs'
    tabs.setAttribute('role', 'tablist')
    tabs.append(
      this.tabButton('packages', 'Packages'),
      this.tabButton('json', 'CycloneDX JSON')
    )

    this.hideContextMenu()
    this.jsonField = null
    this.copyBtn = null
    this.body.replaceChildren()
    this.body.classList.toggle('json-view', this.tab === 'json')
    if (this.tab === 'json') {
      this.body.append(this.renderJson(info.sbom))
    } else {
      this.body.append(this.renderPackages(info.sbom))
    }

    this.dialog.replaceChildren(header, tabs, this.body, this.resizeHandle)
  }

  private onResizePointerDown(e: PointerEvent): void {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    this.resizing = true
    this.resizeStartX = e.clientX
    this.resizeStartY = e.clientY
    this.resizeStartW = this.dialog.getBoundingClientRect().width
    this.resizeStartH = this.dialog.getBoundingClientRect().height
    this.resizeHandle.setPointerCapture(e.pointerId)
  }

  private onResizePointerMove(e: PointerEvent): void {
    if (!this.resizing) return
    const maxW = Math.max(420, window.innerWidth - 24)
    const maxH = Math.max(360, window.innerHeight - 24)
    const width = clamp(this.resizeStartW + (e.clientX - this.resizeStartX), 420, maxW)
    const height = clamp(this.resizeStartH + (e.clientY - this.resizeStartY), 360, maxH)
    this.dialog.style.width = `${Math.round(width)}px`
    this.dialog.style.height = `${Math.round(height)}px`
  }

  private onResizePointerUp(): void {
    this.resizing = false
  }

  private clampDialogToViewport(): void {
    if (!this.open) return
    const maxW = Math.max(420, window.innerWidth - 24)
    const maxH = Math.max(360, window.innerHeight - 24)
    const rect = this.dialog.getBoundingClientRect()
    if (rect.width > maxW) this.dialog.style.width = `${Math.round(maxW)}px`
    if (rect.height > maxH) this.dialog.style.height = `${Math.round(maxH)}px`
  }

  private tabButton(id: 'packages' | 'json', label: string): HTMLButtonElement {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'about-tab'
    btn.setAttribute('role', 'tab')
    btn.setAttribute('aria-selected', String(this.tab === id))
    if (this.tab === id) btn.classList.add('active')
    btn.textContent = label
    btn.addEventListener('click', () => {
      this.tab = id
      this.render()
    })
    return btn
  }

  private renderPackages(sbom: SbomDocument | null): HTMLElement {
    const wrap = document.createElement('div')
    wrap.className = 'about-table-wrap'

    const components = readComponents(sbom)
    if (components.length === 0) {
      const empty = document.createElement('p')
      empty.className = 'about-empty'
      empty.textContent = sbom
        ? 'No components listed in the SBOM.'
        : 'SBOM file was not found. Run npm run sbom to generate it.'
      wrap.append(empty)
      return wrap
    }

    const table = document.createElement('table')
    table.className = 'about-table'
    const thead = document.createElement('thead')
    thead.innerHTML = '<tr><th>Package</th><th>Version</th><th>License</th></tr>'
    const tbody = document.createElement('tbody')
    for (const component of components) {
      const row = document.createElement('tr')
      const name = document.createElement('td')
      name.textContent = component.name ?? '—'
      const version = document.createElement('td')
      version.textContent = component.version ?? '—'
      const license = document.createElement('td')
      license.textContent = formatLicenses(component)
      row.append(name, version, license)
      tbody.append(row)
    }
    table.append(thead, tbody)
    wrap.append(table)
    return wrap
  }

  private renderJson(sbom: SbomDocument | null): HTMLElement {
    const panel = document.createElement('div')
    panel.className = 'about-json-panel'

    const toolbar = document.createElement('div')
    toolbar.className = 'about-json-toolbar'

    const selectBtn = document.createElement('button')
    selectBtn.type = 'button'
    selectBtn.className = 'about-json-btn'
    selectBtn.textContent = 'Select all'
    selectBtn.addEventListener('click', () => this.selectAllJson())

    this.copyBtn = document.createElement('button')
    this.copyBtn.type = 'button'
    this.copyBtn.className = 'about-json-btn'
    this.copyBtn.textContent = 'Copy'
    this.copyBtn.addEventListener('click', () => {
      void this.copyJson()
    })

    toolbar.append(selectBtn, this.copyBtn)

    const field = document.createElement('textarea')
    field.className = 'about-json'
    field.readOnly = true
    field.spellcheck = false
    field.wrap = 'off'
    field.setAttribute('aria-label', 'CycloneDX JSON')
    field.value = sbom
      ? JSON.stringify(sbom, null, 2)
      : '{\n  "error": "SBOM file was not found"\n}'
    field.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.showContextMenu(e.clientX, e.clientY)
    })
    this.jsonField = field

    panel.addEventListener('contextmenu', (e) => {
      if (e.target === field) return
      e.preventDefault()
      e.stopPropagation()
      this.showContextMenu(e.clientX, e.clientY)
    })

    panel.append(toolbar, field)
    return panel
  }

  private menuItem(label: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'about-json-menu-item'
    btn.setAttribute('role', 'menuitem')
    btn.textContent = label
    btn.addEventListener('click', () => {
      this.hideContextMenu()
      onClick()
    })
    return btn
  }

  private showContextMenu(x: number, y: number): void {
    this.contextMenu.style.left = `${x}px`
    this.contextMenu.style.top = `${y}px`
    this.contextMenu.hidden = false
    const pad = 8
    const rect = this.contextMenu.getBoundingClientRect()
    const left = Math.min(x, window.innerWidth - rect.width - pad)
    const top = Math.min(y, window.innerHeight - rect.height - pad)
    this.contextMenu.style.left = `${Math.max(pad, left)}px`
    this.contextMenu.style.top = `${Math.max(pad, top)}px`
  }

  private hideContextMenu(): void {
    this.contextMenu.hidden = true
  }

  private selectAllJson(): void {
    const field = this.jsonField
    if (!field) return
    field.focus()
    field.select()
  }

  private async copyJson(): Promise<void> {
    const text = this.jsonField?.value ?? ''
    let ok = false
    try {
      await navigator.clipboard.writeText(text)
      ok = true
    } catch {
      if (this.jsonField) {
        this.jsonField.focus()
        this.jsonField.select()
        ok = document.execCommand('copy')
      }
    }
    this.setCopyLabel(ok ? 'Copied' : 'Copy failed')
  }

  private setCopyLabel(label: string): void {
    if (!this.copyBtn) return
    this.copyBtn.textContent = label
    if (this.copyResetTimer) clearTimeout(this.copyResetTimer)
    this.copyResetTimer = setTimeout(() => {
      if (this.copyBtn) this.copyBtn.textContent = 'Copy'
      this.copyResetTimer = null
    }, 1600)
  }
}

function readComponents(sbom: SbomDocument | null): SbomComponent[] {
  if (!sbom) return []
  const raw = sbom.components
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is SbomComponent => Boolean(item) && typeof item === 'object')
    .slice()
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' }))
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function formatLicenses(component: SbomComponent): string {
  const parts: string[] = []
  for (const entry of component.licenses ?? []) {
    if (entry.expression) parts.push(entry.expression)
    else if (entry.license?.id) parts.push(entry.license.id)
    else if (entry.license?.name) parts.push(entry.license.name)
  }
  return parts.join(', ') || '—'
}
