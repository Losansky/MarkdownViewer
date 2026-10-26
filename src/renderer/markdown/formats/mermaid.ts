import type MarkdownIt from 'markdown-it'
import type { MermaidFormatConfig } from '../../../shared/types'

let lastInitKey: string | null = null

const MERMAID_FENCE_LANGS = new Set(['mermaid', 'mmd'])

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function isMermaidLang(lang: string, fenceName: string): boolean {
  return lang === fenceName || MERMAID_FENCE_LANGS.has(lang)
}

function diagramLineEnd(source: string): number {
  if (!source) return 1
  let n = 1
  for (let i = 0; i < source.length; i++) {
    if (source.charCodeAt(i) === 10) n++
  }
  return n
}

/** Whole `.mmd` / `.mermaid` file, ready for `renderMermaidDiagrams` to replace with SVG. */
export function mermaidDocumentHtml(source: string): string {
  const body = source.replace(/\s+$/, '')
  const end = diagramLineEnd(body)
  return (
    `<div class="mermaid-wrap mermaid-document" data-source-line="1" data-source-line-end="${end}">` +
    `<pre class="mermaid">${escapeHtml(body)}</pre></div>\n`
  )
}

export function applyMermaidFence(md: MarkdownIt, config: MermaidFormatConfig): void {
  if (!config.enabled) return

  const fenceName = (config.fence || 'mermaid').toLowerCase()
  const defaultFence =
    md.renderer.rules.fence ??
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const info = (token.info || '').trim().toLowerCase()
    const lang = info.split(/\s+/)[0] ?? ''

    if (isMermaidLang(lang, fenceName)) {
      const source = token.content.trimEnd()
      const escaped = md.utils.escapeHtml(source)
      return `<div class="mermaid-wrap"><pre class="mermaid">${escaped}</pre></div>\n`
    }

    return defaultFence(tokens, idx, options, env, self)
  }
}

export async function renderMermaidDiagrams(
  root: HTMLElement,
  config: MermaidFormatConfig
): Promise<string[]> {
  if (!config.enabled) return []

  const nodes = root.querySelectorAll<HTMLElement>('.mermaid')
  if (nodes.length === 0) return []

  const { default: mermaid } = await import('mermaid')
  const theme = config.theme || 'default'
  const initKey = JSON.stringify({
    theme,
    securityLevel: config.securityLevel,
    fontFamily: config.fontFamily,
    themeVariables: config.themeVariables
  })
  if (lastInitKey !== initKey) {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme as 'default' | 'dark' | 'forest' | 'neutral' | 'base',
      securityLevel: config.securityLevel || 'strict',
      themeVariables: config.themeVariables || {},
      fontFamily: config.fontFamily || undefined
    })
    lastInitKey = initKey
  }

  const errors: string[] = []

  // Assign unique IDs so re-renders don't collide
  nodes.forEach((node, i) => {
    node.removeAttribute('data-processed')
    if (!node.id) {
      node.id = `mermaid-${Date.now()}-${i}`
    }
  })

  try {
    await mermaid.run({ nodes: Array.from(nodes) })
  } catch (err) {
    // mermaid.run may throw for a batch; also check individual errors in DOM
    const message = err instanceof Error ? err.message : String(err)
    errors.push(message)
  }

  // Surface parse errors that mermaid may inject
  root.querySelectorAll('.mermaid').forEach((el) => {
    const text = el.textContent ?? ''
    if (text.includes('Syntax error') || el.classList.contains('error')) {
      errors.push(text.slice(0, 200))
    }
  })

  return errors
}
