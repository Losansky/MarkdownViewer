import type MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import markdown from 'highlight.js/lib/languages/markdown'
import sql from 'highlight.js/lib/languages/sql'
import yaml from 'highlight.js/lib/languages/yaml'
import java from 'highlight.js/lib/languages/java'
import csharp from 'highlight.js/lib/languages/csharp'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import type { CodeHighlightFormatConfig } from '../../../shared/types'

let registered = false

function ensureLanguages(): void {
  if (registered) return
  hljs.registerLanguage('javascript', javascript)
  hljs.registerLanguage('js', javascript)
  hljs.registerLanguage('typescript', typescript)
  hljs.registerLanguage('ts', typescript)
  hljs.registerLanguage('json', json)
  hljs.registerLanguage('xml', xml)
  hljs.registerLanguage('html', xml)
  hljs.registerLanguage('css', css)
  hljs.registerLanguage('python', python)
  hljs.registerLanguage('py', python)
  hljs.registerLanguage('bash', bash)
  hljs.registerLanguage('shell', bash)
  hljs.registerLanguage('sh', bash)
  hljs.registerLanguage('markdown', markdown)
  hljs.registerLanguage('md', markdown)
  hljs.registerLanguage('sql', sql)
  hljs.registerLanguage('yaml', yaml)
  hljs.registerLanguage('yml', yaml)
  hljs.registerLanguage('java', java)
  hljs.registerLanguage('csharp', csharp)
  hljs.registerLanguage('cs', csharp)
  hljs.registerLanguage('go', go)
  hljs.registerLanguage('rust', rust)
  registered = true
}

function wrapNumberedLines(lineBodies: string[]): string {
  return lineBodies
    .map(
      (lineHtml, i) =>
        `<span class="hljs-ln-line"><span class="hljs-ln-num" aria-hidden="true">${i + 1}</span><span class="hljs-ln-code">${lineHtml}</span></span>`
    )
    .join('\n')
}

function highlightToLines(highlighted: string, content: string): string {
  const srcLines = content.replace(/\n$/, '').split('\n')
  const htmlLines = highlighted.split(/\r?\n/)
  return wrapNumberedLines(srcLines.map((_, i) => htmlLines[i] ?? ''))
}

function classAttr(parts: Array<string | false | null | undefined>): string {
  const classes = parts.filter((part): part is string => Boolean(part))
  return classes.length > 0 ? ` class="${classes.join(' ')}"` : ''
}

export function applyCodeHighlight(
  md: MarkdownIt,
  config: CodeHighlightFormatConfig,
  reservedFences: Set<string>
): void {
  if (!config.enabled) return
  ensureLanguages()

  const defaultFence =
    md.renderer.rules.fence ??
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const info = (token.info || '').trim()
    const lang = info.split(/\s+/)[0]?.toLowerCase() ?? ''
    const content = token.content.replace(/\n$/, '')

    if (lang && reservedFences.has(lang)) {
      return defaultFence(tokens, idx, options, env, self)
    }

    const langClass = lang ? `language-${md.utils.escapeHtml(lang)}` : ''

    if (lang && hljs.getLanguage(lang)) {
      try {
        const highlighted = hljs.highlight(content, { language: lang, ignoreIllegals: true })
        if (config.lineNumbers) {
          const body = highlightToLines(highlighted.value, content)
          return `<pre class="hljs hljs-line-numbers"><code${classAttr([langClass, 'hljs-ln'])}>${body}</code></pre>\n`
        }
        return `<pre class="hljs"><code${classAttr([langClass])}>${highlighted.value}</code></pre>\n`
      } catch {
        // fall through
      }
    }

    const escaped = md.utils.escapeHtml(content)
    if (config.lineNumbers) {
      const body = wrapNumberedLines(content.split('\n').map((line) => md.utils.escapeHtml(line)))
      return `<pre class="hljs hljs-line-numbers"><code${classAttr([langClass, 'hljs', 'hljs-ln'])}>${body}</code></pre>\n`
    }
    return `<pre class="hljs"><code${classAttr([langClass])}>${escaped}</code></pre>\n`
  }
}

export function highlightThemeHref(theme: string): string {
  const map: Record<string, string> = {
    github: 'github',
    'github-dark': 'github-dark',
    'github-dark-dimmed': 'github-dark-dimmed',
    monokai: 'monokai',
    vs: 'vs',
    vs2015: 'vs2015',
    'atom-one-dark': 'atom-one-dark',
    'atom-one-light': 'atom-one-light'
  }
  return map[theme] ?? 'github'
}
