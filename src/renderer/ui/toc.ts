import { extractHeadings, type HeadingEntry } from '../../shared/headingSlug'

export class TocPanel {
  private visible = false
  private entries: HeadingEntry[] = []
  private onNavigate: ((id: string) => void) | null = null

  constructor(
    private rootEl: HTMLElement,
    private listEl: HTMLElement
  ) {}

  setOnNavigate(handler: ((id: string) => void) | null): void {
    this.onNavigate = handler
  }

  isVisible(): boolean {
    return this.visible
  }

  setVisible(visible: boolean): void {
    this.visible = visible
    this.rootEl.hidden = !visible
    document.getElementById('app')?.classList.toggle('toc-open', visible)
  }

  toggle(): boolean {
    this.setVisible(!this.visible)
    return this.visible
  }

  setSource(markdown: string | null): void {
    this.entries = markdown ? extractHeadings(markdown) : []
    this.render()
  }

  private render(): void {
    this.listEl.replaceChildren()
    if (this.entries.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'toc-empty'
      empty.textContent = 'No headings in this file'
      this.listEl.append(empty)
      return
    }

    for (const entry of this.entries) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = `toc-item toc-level-${entry.level}`
      btn.textContent = entry.text
      btn.title = entry.text
      btn.addEventListener('click', () => {
        this.onNavigate?.(entry.id)
      })
      this.listEl.append(btn)
    }
  }
}
