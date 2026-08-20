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
      if (!token.map) continue
      const line = String(token.map[0] + 1)
      if (token.nesting === 1 || SELF_CLOSING.has(token.type)) {
        token.attrSet('data-source-line', line)
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
      return injectFirstTagAttr(html, 'data-source-line', line)
    }
  }
}
