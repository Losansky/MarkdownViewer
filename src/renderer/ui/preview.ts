import type { MermaidFormatConfig, PresentationConfig } from '../../shared/types'
import { createPipeline } from '../markdown/createPipeline'
import { renderMermaidDiagrams } from '../markdown/formats/mermaid'
import { highlightThemeHref } from '../markdown/formats/codeHighlight'
import { LineGutterController } from './lineGutter'

const highlightThemeLoaders: Record<string, () => Promise<{ default: string }>> = {
  github: () => import('highlight.js/styles/github.min.css?url'),
  'github-dark': () => import('highlight.js/styles/github-dark.min.css?url'),
  'github-dark-dimmed': () => import('highlight.js/styles/github-dark-dimmed.min.css?url'),
  monokai: () => import('highlight.js/styles/monokai.min.css?url'),
  vs: () => import('highlight.js/styles/vs.min.css?url'),
  vs2015: () => import('highlight.js/styles/vs2015.min.css?url'),
  'atom-one-dark': () => import('highlight.js/styles/atom-one-dark.min.css?url'),
  'atom-one-light': () => import('highlight.js/styles/atom-one-light.min.css?url')
}

const HLJS_LINK_ID = 'mdv-hljs-theme'

function resolveHighlightTheme(config: PresentationConfig): string {
  const theme = highlightThemeHref(config.formats.codeHighlight.theme)
  // Auto-pair common light code themes when the app is in dark mode
  if (config.presentation.theme === 'dark') {
    if (theme === 'github') return 'github-dark'
    if (theme === 'atom-one-light') return 'atom-one-dark'
    if (theme === 'vs') return 'vs2015'
  }
  return theme
}

/** When mermaid is left on "default", follow the app light/dark theme. */
export function resolveMermaidConfig(config: PresentationConfig): MermaidFormatConfig {
  const mermaid = config.formats.mermaid
  const themeName = (mermaid.theme || 'default').toLowerCase()
  if (themeName === 'default' || themeName === 'auto') {
    return {
      ...mermaid,
      theme: config.presentation.theme === 'dark' ? 'dark' : 'default'
    }
  }
  return mermaid
}

export class PreviewController {
  private config: PresentationConfig
  private pipeline: ReturnType<typeof createPipeline>
  private content = ''
  private path: string | null = null
  private renderToken = 0
  private onLinkClick: ((href: string) => void) | null = null
  private lineGutter: LineGutterController | null = null

  constructor(
    private previewEl: HTMLElement,
    private errorEl: HTMLElement,
    config: PresentationConfig
  ) {
    this.config = config
    this.pipeline = createPipeline(config)
    const docView = document.getElementById('doc-view')
    const gutter = document.getElementById('line-gutter')
    if (docView && gutter) {
      this.lineGutter = new LineGutterController(docView, gutter, previewEl)
      this.lineGutter.setEnabled(config.formats.codeHighlight.lineNumbers)
    }
    this.previewEl.addEventListener('click', (event) => {
      this.handlePreviewClick(event)
    })
  }

  setOnLinkClick(handler: ((href: string) => void) | null): void {
    this.onLinkClick = handler
  }

  private handlePreviewClick(event: MouseEvent): void {
    if (event.defaultPrevented) return
    if (event.button !== 0) return
    // Allow modified clicks to fall through for accessibility; we still prevent navigation
    const target = event.target
    if (!(target instanceof Element)) return
    const anchor = target.closest('a[href]')
    if (!anchor || !this.previewEl.contains(anchor)) return

    const href = anchor.getAttribute('href')
    if (!href) return

    // Always stop the renderer from navigating (would hit localhost:5173 for relative links)
    event.preventDefault()
    event.stopPropagation()

    this.onLinkClick?.(href)
  }

  /** Scroll to a heading/anchor id inside the current preview (if present). */
  scrollToHash(hash: string): void {
    if (!hash) return
    const id = hash.replace(/^#/, '')
    if (!id) return
    const decoded = (() => {
      try {
        return decodeURIComponent(id)
      } catch {
        return id
      }
    })()
    // Prefer id, then name= for older markdown anchors
    const el =
      this.previewEl.querySelector(`#${cssEscape(decoded)}`) ??
      this.previewEl.querySelector(`[name="${cssEscapeAttr(decoded)}"]`) ??
      // GitHub-style: heading text as id often lowercased
      this.previewEl.querySelector(`#${cssEscape(decoded.toLowerCase())}`)
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  setConfig(config: PresentationConfig): void {
    this.config = config
    this.pipeline = createPipeline(config)
    this.lineGutter?.setEnabled(config.formats.codeHighlight.lineNumbers)
    this.applyPresentationStyles()
    void this.loadHighlightTheme()
    if (this.path !== null) {
      void this.render(this.content)
    }
  }

  getPath(): string | null {
    return this.path
  }

  clear(): void {
    this.path = null
    this.content = ''
    this.clearError()
    this.previewEl.innerHTML = ''
    this.previewEl.classList.remove('has-content')
    this.lineGutter?.clear()
  }

  showError(message: string): void {
    this.errorEl.hidden = false
    this.errorEl.textContent = message
  }

  clearError(): void {
    this.errorEl.hidden = true
    this.errorEl.textContent = ''
  }

  applyPresentationStyles(): void {
    const p = this.config.presentation
    const root = document.documentElement
    root.dataset.theme = p.theme
    // color-scheme helps native scrollbars / form controls match dark mode
    root.style.colorScheme = p.theme === 'dark' ? 'dark' : 'light'
    root.style.setProperty('--md-font-family', p.fontFamily)
    root.style.setProperty('--md-font-size', `${p.fontSizePx}px`)
    root.style.setProperty('--md-line-height', String(p.lineHeight))
    root.style.setProperty('--md-max-width', `${p.maxWidthPx}px`)
    root.style.setProperty('--md-code-font-family', p.codeFontFamily)
    if (p.background) {
      root.style.setProperty('--md-bg', p.background)
    } else {
      root.style.removeProperty('--md-bg')
    }
    if (p.foreground) {
      root.style.setProperty('--md-fg', p.foreground)
    } else {
      root.style.removeProperty('--md-fg')
    }

    const types = this.config.formats.admonitions.types
    for (const [name, type] of Object.entries(types)) {
      root.style.setProperty(`--admonition-${name}-color`, type.color)
    }
  }

  async loadHighlightTheme(): Promise<void> {
    if (!this.config.formats.codeHighlight.enabled) return

    const resolved = resolveHighlightTheme(this.config)
    const loader = highlightThemeLoaders[resolved] ?? highlightThemeLoaders.github
    try {
      const mod = await loader()
      const href = mod.default
      let link = document.getElementById(HLJS_LINK_ID) as HTMLLinkElement | null
      if (!link) {
        link = document.createElement('link')
        link.id = HLJS_LINK_ID
        link.rel = 'stylesheet'
        document.head.append(link)
      }
      if (link.getAttribute('href') !== href) {
        link.setAttribute('href', href)
      }
    } catch (err) {
      console.warn('Could not load highlight theme:', err)
    }
  }

  async open(path: string, content: string, scrollHash?: string | null): Promise<void> {
    this.path = path
    this.content = content
    this.previewEl.classList.add('has-content')
    this.clearError()
    await this.render(content, scrollHash)
  }

  private async render(source: string, scrollHash?: string | null): Promise<void> {
    const token = ++this.renderToken
    try {
      const { html } = this.pipeline.render(source, { documentPath: this.path })
      if (token !== this.renderToken) return
      this.previewEl.innerHTML = html

      const mermaidErrors = await renderMermaidDiagrams(
        this.previewEl,
        resolveMermaidConfig(this.config)
      )
      if (token !== this.renderToken) return
      if (mermaidErrors.length > 0) {
        this.showError(`Mermaid: ${mermaidErrors[0]}`)
      }
      this.lineGutter?.setSource(source)
      if (scrollHash) {
        // Defer until layout after mermaid
        requestAnimationFrame(() => this.scrollToHash(scrollHash))
      }
    } catch (err) {
      if (token !== this.renderToken) return
      const message = err instanceof Error ? err.message : String(err)
      this.showError(`Render failed: ${message}`)
    }
  }
}

function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }
  return value.replace(/([^a-zA-Z0-9_-])/g, '\\$1')
}

function cssEscapeAttr(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}
