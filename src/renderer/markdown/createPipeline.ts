import MarkdownIt from 'markdown-it'
import taskLists from 'markdown-it-task-lists'
import multimdTable from 'markdown-it-multimd-table'
import type { PresentationConfig } from '../../shared/types'
import { slugifyHeading } from '../../shared/headingSlug'
import { resolveRelativePath, toFileUrl } from '../../shared/pathUtils'
import { applyMermaidFence } from './formats/mermaid'
import { applyMathFence, preprocessMathWithPlaceholders, restoreMathPlaceholders } from './formats/math'
import { applyCodeHighlight } from './formats/codeHighlight'
import { applyAdmonitions } from './formats/admonitions'
import { applySourceLineAttributes } from './sourceLines'

export interface RenderResult {
  html: string
}

export interface RenderEnv {
  documentPath?: string | null
}

function isExternalHref(href: string): boolean {
  return /^(https?:|mailto:|tel:)/i.test(href) || href.startsWith('//')
}

function isAbsoluteLocalHref(href: string): boolean {
  return (
    /^file:/i.test(href) ||
    /^[a-zA-Z]:[\\/]/.test(href) ||
    href.startsWith('\\\\') ||
    href.startsWith('/')
  )
}

export function createPipeline(config: PresentationConfig): {
  render: (source: string, env?: RenderEnv) => RenderResult
} {
  const md = new MarkdownIt({
    html: config.markdown.html,
    linkify: config.markdown.linkify,
    typographer: config.markdown.typographer,
    breaks: config.markdown.breaks
  })

  md.core.ruler.push('heading_ids', (state) => {
    const slugCounts = new Map<string, number>()
    for (const token of state.tokens) {
      if (token.type !== 'heading_open') continue
      const inline = state.tokens[state.tokens.indexOf(token) + 1]
      if (!inline || inline.type !== 'inline') continue
      const text = inline.content.trim()
      if (!text) continue
      token.attrSet('id', slugifyHeading(text, slugCounts))
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
  applySourceLineAttributes(md)

  const defaultLinkOpen =
    md.renderer.rules.link_open ??
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const href = token.attrGet('href')
    if (href) {
      if (isExternalHref(href)) {
        token.attrSet('target', '_blank')
        token.attrSet('rel', 'noopener noreferrer')
        token.attrSet('data-md-link', 'external')
      } else {
        token.attrSet('data-md-link', 'local')
      }
    }
    return defaultLinkOpen(tokens, idx, options, env, self)
  }

  const defaultImage =
    md.renderer.rules.image ??
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const src = token.attrGet('src')
    const docPath = (env as RenderEnv)?.documentPath
    if (src && docPath && !isExternalHref(src) && !isAbsoluteLocalHref(src)) {
      const resolved = resolveRelativePath(docPath, src)
      token.attrSet('src', toFileUrl(resolved))
    }
    return defaultImage(tokens, idx, options, env, self)
  }

  return {
    render(source: string, env: RenderEnv = {}): RenderResult {
      const { text, slots } = preprocessMathWithPlaceholders(source, config.formats.math)
      let html = md.render(text, env)
      html = restoreMathPlaceholders(html, slots)
      return { html }
    }
  }
}

/** Headless render helper for smoke tests and scripts. */
export function renderMarkdown(source: string, config: PresentationConfig): RenderResult {
  return createPipeline(config).render(source)
}
