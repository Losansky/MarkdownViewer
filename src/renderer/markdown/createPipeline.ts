import MarkdownIt from 'markdown-it'
import taskLists from 'markdown-it-task-lists'
import multimdTable from 'markdown-it-multimd-table'
import type { PresentationConfig } from '../../shared/types'
import { applyMermaidFence } from './formats/mermaid'
import { applyMathFence, preprocessMathWithPlaceholders, restoreMathPlaceholders } from './formats/math'
import { applyCodeHighlight } from './formats/codeHighlight'
import { applyAdmonitions } from './formats/admonitions'

export interface RenderResult {
  html: string
}

export function createPipeline(config: PresentationConfig): {
  render: (source: string) => RenderResult
} {
  const md = new MarkdownIt({
    html: config.markdown.html,
    linkify: config.markdown.linkify,
    typographer: config.markdown.typographer,
    breaks: config.markdown.breaks
  })

  // Stable heading ids so #section links can scroll within a document
  md.core.ruler.push('heading_ids', (state) => {
    const slugCounts = new Map<string, number>()
    for (const token of state.tokens) {
      if (token.type !== 'heading_open') continue
      const inline = state.tokens[state.tokens.indexOf(token) + 1]
      if (!inline || inline.type !== 'inline') continue
      const text = inline.content.trim()
      if (!text) continue
      let slug = text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s_-]/gu, '')
        .trim()
        .replace(/\s+/g, '-')
      if (!slug) slug = 'section'
      const count = slugCounts.get(slug) ?? 0
      slugCounts.set(slug, count + 1)
      if (count > 0) slug = `${slug}-${count}`
      token.attrSet('id', slug)
    }
  })

  md.use(taskLists, { enabled: true, label: true, labelAfter: true })
  md.use(multimdTable, {
    multiline: true,
    rowspan: false,
    headerless: false,
    multibody: true,
    aotolabel: true
  })

  // Order matters: specialized fences first, then code highlight as fallback
  applyMermaidFence(md, config.formats.mermaid)
  applyMathFence(md, config.formats.math)

  const reserved = new Set<string>()
  if (config.formats.mermaid.enabled) {
    reserved.add((config.formats.mermaid.fence || 'mermaid').toLowerCase())
  }
  if (config.formats.math.enabled) {
    reserved.add('math')
    reserved.add('latex')
    reserved.add('katex')
  }

  applyCodeHighlight(md, config.formats.codeHighlight, reserved)
  applyAdmonitions(md, config.formats.admonitions)

  // Classify links: external → new window (handled by main); local → intercepted in preview
  const defaultLinkOpen =
    md.renderer.rules.link_open ??
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const href = token.attrGet('href')
    if (href) {
      const isExternal =
        /^(https?:|mailto:|tel:)/i.test(href) || href.startsWith('//')
      if (isExternal) {
        token.attrSet('target', '_blank')
        token.attrSet('rel', 'noopener noreferrer')
        token.attrSet('data-md-link', 'external')
      } else {
        // Relative/absolute paths and #anchors — preview click handler resolves them
        token.attrSet('data-md-link', 'local')
      }
    }
    return defaultLinkOpen(tokens, idx, options, env, self)
  }

  return {
    render(source: string): RenderResult {
      const { text, slots } = preprocessMathWithPlaceholders(source, config.formats.math)
      let html = md.render(text)
      html = restoreMathPlaceholders(html, slots)
      return { html }
    }
  }
}
