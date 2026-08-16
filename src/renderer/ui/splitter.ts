/**
 * Drag handle between sidebar and workspace. Width is persisted in localStorage.
 */

const STORAGE_KEY = 'mdv-sidebar-width'
const MIN_WIDTH = 160
const MAX_WIDTH = 560
const DEFAULT_WIDTH = 260

export class SidebarSplitter {
  private dragging = false
  private startX = 0
  private startWidth = 0

  constructor(
    private appEl: HTMLElement,
    private sidebarEl: HTMLElement,
    private splitterEl: HTMLElement
  ) {
    const saved = loadWidth()
    this.applyWidth(saved)

    this.splitterEl.setAttribute('role', 'separator')
    this.splitterEl.setAttribute('aria-orientation', 'vertical')
    this.splitterEl.setAttribute('aria-label', 'Resize sidebar')
    this.splitterEl.tabIndex = 0

    this.splitterEl.addEventListener('pointerdown', (e) => this.onPointerDown(e))
    this.splitterEl.addEventListener('keydown', (e) => this.onKeyDown(e))
    window.addEventListener('pointermove', (e) => this.onPointerMove(e))
    window.addEventListener('pointerup', (e) => this.onPointerUp(e))
    window.addEventListener('pointercancel', (e) => this.onPointerUp(e))
  }

  private onPointerDown(e: PointerEvent): void {
    if (this.appEl.classList.contains('sidebar-collapsed')) return
    if (e.button !== 0) return
    e.preventDefault()
    this.dragging = true
    this.startX = e.clientX
    this.startWidth = this.sidebarEl.getBoundingClientRect().width
    this.appEl.classList.add('is-resizing')
    this.splitterEl.classList.add('active')
    try {
      this.splitterEl.setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.dragging) return
    const delta = e.clientX - this.startX
    this.applyWidth(this.startWidth + delta)
  }

  private onPointerUp(e: PointerEvent): void {
    if (!this.dragging) return
    this.dragging = false
    this.appEl.classList.remove('is-resizing')
    this.splitterEl.classList.remove('active')
    try {
      this.splitterEl.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
    const width = this.sidebarEl.getBoundingClientRect().width
    saveWidth(width)
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (this.appEl.classList.contains('sidebar-collapsed')) return
    const step = e.shiftKey ? 40 : 12
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      this.applyWidth(this.sidebarEl.getBoundingClientRect().width - step)
      saveWidth(this.sidebarEl.getBoundingClientRect().width)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      this.applyWidth(this.sidebarEl.getBoundingClientRect().width + step)
      saveWidth(this.sidebarEl.getBoundingClientRect().width)
    } else if (e.key === 'Home') {
      e.preventDefault()
      this.applyWidth(MIN_WIDTH)
      saveWidth(MIN_WIDTH)
    } else if (e.key === 'End') {
      e.preventDefault()
      this.applyWidth(MAX_WIDTH)
      saveWidth(MAX_WIDTH)
    }
  }

  private applyWidth(width: number): void {
    const clamped = Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width)))
    this.appEl.style.setProperty('--sidebar-width', `${clamped}px`)
    this.splitterEl.setAttribute('aria-valuenow', String(clamped))
    this.splitterEl.setAttribute('aria-valuemin', String(MIN_WIDTH))
    this.splitterEl.setAttribute('aria-valuemax', String(MAX_WIDTH))
  }
}

function loadWidth(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_WIDTH
    const n = Number(raw)
    if (!Number.isFinite(n)) return DEFAULT_WIDTH
    return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, n))
  } catch {
    return DEFAULT_WIDTH
  }
}

function saveWidth(width: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Math.round(width)))
  } catch {
    // ignore quota / private mode
  }
}
