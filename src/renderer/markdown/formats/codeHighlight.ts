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

    if (lang && reservedFences.has(lang)) {
      return defaultFence(tokens, idx, options, env, self)
    }

    if (lang && hljs.getLanguage(lang)) {
      try {
        const highlighted = hljs.highlight(token.content, { language: lang, ignoreIllegals: true })
        const lineClass = config.lineNumbers ? ' hljs-line-numbers' : ''
        return `<pre class="hljs${lineClass}"><code class="language-${md.utils.escapeHtml(lang)}">${highlighted.value}</code></pre>\n`
      } catch {
        // fall through
      }
    }

    const escaped = md.utils.escapeHtml(token.content)
    const langClass = lang ? ` class="language-${md.utils.escapeHtml(lang)}"` : ''
    return `<pre class="hljs"><code${langClass}>${escaped}</code></pre>\n`
  }
}

export function highlightThemeHref(theme: string): string {
  // Map config theme names to highlight.js CSS file basenames under /node_modules
  const map: Record<string, string> = {
    github: 'github',
    'github-dark': 'github-dark',
    'github-dark-dimmed': 'github-dark-dimmed',
    monokai: 'monokai',
    vs: 'vs',
    'vs2015': 'vs2015',
    'atom-one-dark': 'atom-one-dark',
    'atom-one-light': 'atom-one-light'
  }
  return map[theme] ?? 'github'
}
