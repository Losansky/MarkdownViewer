import type MarkdownIt from 'markdown-it'

const SELF_CLOSING = new Set(['fence', 'code_block', 'hr', 'html_block'])

export function countSourceLines(source: string): number {
  if (!source) return 0
  let n = 1
  for (let i = 0; i < source.length; i++) {
    if (source.charCodeAt(i) === 10) n++
  }
  return n
}

function parsePositiveLine(value: string | null | undefined): number | null {
  if (!value || !/^[0-9]+$/.test(value)) return null
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1) return null
  return n
}

/** Inclusive 1-based line numbers from `data-source-line` / `data-source-line-end`. */
export function parseSourceLineRange(
  startAttr: string | null | undefined,
  endAttr: string | null | undefined
): { start: number; end: number } | null {
  const start = parsePositiveLine(startAttr)
  if (start == null) return null
  const endParsed = parsePositiveLine(endAttr)
  const end = endParsed != null && endParsed >= start ? endParsed : start
  return { start, end }
}

/**
 * Slice inclusive 1-based lines. Keeps CRLF when the source uses it.
 * `endLine` may extend past the last line; the slice stops at the end.
 */
export function sliceSourceLines(source: string, startLine: number, endLine: number): string {
  if (!source) return ''
  if (!Number.isInteger(startLine) || !Number.isInteger(endLine)) return ''
  if (startLine < 1 || endLine < startLine) return ''
  const newline = source.includes('\r\n') ? '\r\n' : '\n'
  const lines = source.split(/\r?\n/)
  if (startLine > lines.length) return ''
  return lines.slice(startLine - 1, endLine).join(newline)
}

function sourceLinePair(map: readonly number[] | null): { start: string; end: string } | null {
  if (!map || map.length < 2) return null
  const start = map[0] + 1
  if (!Number.isInteger(start) || start < 1) return null
  // markdown-it map end is exclusive and 0-based, which equals the inclusive 1-based end line.
  const end = Math.max(start, map[1])
  return { start: String(start), end: String(end) }
}

export function injectFirstTagAttr(html: string, name: string, value: string): string {
  const start = html.search(/<\w/)
  if (start < 0) return html
  const slice = html.slice(start, start + 256)
  if (new RegExp(`\\s${name}=`).test(slice)) return html
  return (
    html.slice(0, start) +
    html.slice(start).replace(/^<[a-zA-Z][\w:-]*(\s|\/?>)/, (tagAndEnd) => {
      const tag = tagAndEnd.replace(/(\s|\/?>)$/, '')
      const end = tagAndEnd.slice(tag.length)
      if (end === '>') return `${tag} ${name}="${value}">`
      if (end.startsWith('/')) return `${tag} ${name}="${value}"${end}`
      return `${tag} ${name}="${value}" `
    })
  )
}

export function applySourceLineAttributes(md: MarkdownIt): void {
  md.core.ruler.push('source_line_attrs', (state) => {
    for (const token of state.tokens) {
      const lines = sourceLinePair(token.map)
      if (!lines) continue
      if (token.nesting === 1 || SELF_CLOSING.has(token.type)) {
        token.attrSet('data-source-line', lines.start)
        token.attrSet('data-source-line-end', lines.end)
      }
    }
  })

  for (const ruleName of ['fence', 'code_block', 'hr', 'html_block'] as const) {
    const orig = md.renderer.rules[ruleName]
    if (!orig) continue
    md.renderer.rules[ruleName] = (tokens, idx, options, env, self) => {
      const html = orig(tokens, idx, options, env, self)
      const line = tokens[idx].attrGet('data-source-line')
      if (!line) return html
      const end = tokens[idx].attrGet('data-source-line-end')
      let next = injectFirstTagAttr(html, 'data-source-line', line)
      if (end) next = injectFirstTagAttr(next, 'data-source-line-end', end)
      return next
    }
  }
}
