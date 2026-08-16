import type MarkdownIt from 'markdown-it'
import mermaid from 'mermaid'
import type { MermaidFormatConfig } from '../../../shared/types'

let initialized = false
let lastTheme: string | null = null

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

    if (lang === fenceName) {
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

  const theme = config.theme || 'default'
  if (!initialized || lastTheme !== theme) {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme as 'default' | 'dark' | 'forest' | 'neutral' | 'base',
      securityLevel: config.securityLevel || 'strict',
      themeVariables: config.themeVariables || {},
      fontFamily: config.fontFamily || undefined
    })
    initialized = true
    lastTheme = theme
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
