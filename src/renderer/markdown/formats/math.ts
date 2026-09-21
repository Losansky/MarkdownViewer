import type MarkdownIt from 'markdown-it'
import katex from 'katex'
import type { MathFormatConfig } from '../../../shared/types'

function renderKatex(tex: string, displayMode: boolean, throwOnError: boolean): string {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError,
      strict: 'ignore'
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return `<span class="math-error" title="${escapeAttr(message)}">${escapeHtml(tex)}</span>`
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, '&#39;')
}

function isEscaped(source: string, index: number): boolean {
  let slashes = 0
  for (let i = index - 1; i >= 0 && source[i] === '\\'; i--) slashes++
  return slashes % 2 === 1
}

function isWhitespace(ch: string | undefined): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r'
}

function isDigit(ch: string | undefined): boolean {
  return ch !== undefined && ch >= '0' && ch <= '9'
}

/**
 * Pandoc-style inline `$...$` so currency like `$24,796.80 | $413.28` is not math.
 * Opening `$` must be followed by a non-space; closing `$` must be preceded by a
 * non-space and not followed by a digit; the span cannot cross a newline.
 */
function replaceInlineDollarMath(
  source: string,
  replacer: (inner: string) => string
): string {
  let result = ''
  let i = 0
  while (i < source.length) {
    const start = source.indexOf('$', i)
    if (start === -1) {
      result += source.slice(i)
      break
    }
    result += source.slice(i, start)
    if (isEscaped(source, start) || source[start + 1] === '$') {
      result += '$'
      i = start + 1
      continue
    }
    const contentStart = start + 1
    if (contentStart >= source.length || isWhitespace(source[contentStart])) {
      result += '$'
      i = start + 1
      continue
    }
    const newline = source.indexOf('\n', contentStart)
    const limit = newline === -1 ? source.length : newline
    let end = -1
    for (let j = contentStart; j < limit; j++) {
      if (source[j] !== '$' || isEscaped(source, j) || source[j + 1] === '$') continue
      if (isWhitespace(source[j - 1]) || isDigit(source[j + 1])) continue
      end = j
      break
    }
    if (end === -1) {
      result += '$'
      i = start + 1
      continue
    }
    result += replacer(source.slice(contentStart, end))
    i = end + 1
  }
  return result
}

function replaceDelimited(
  source: string,
  open: string,
  close: string,
  replacer: (inner: string) => string
): string {
  if (!open || !close) return source
  if (open === '$' && close === '$') {
    return replaceInlineDollarMath(source, replacer)
  }
  let result = ''
  let i = 0
  while (i < source.length) {
    const start = source.indexOf(open, i)
    if (start === -1) {
      result += source.slice(i)
      break
    }
    result += source.slice(i, start)
    const contentStart = start + open.length
    const end = source.indexOf(close, contentStart)
    if (end === -1) {
      result += source.slice(start)
      break
    }
    const inner = source.slice(contentStart, end)
    result += replacer(inner)
    i = end + close.length
  }
  return result
}

export function applyMathFence(md: MarkdownIt, config: MathFormatConfig): void {
  if (!config.enabled) return

  const defaultFence =
    md.renderer.rules.fence ??
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const info = (token.info || '').trim().toLowerCase()
    const lang = info.split(/\s+/)[0] ?? ''

    if (lang === 'math' || lang === 'latex' || lang === 'katex') {
      const html = renderKatex(token.content.trim(), true, config.throwOnError)
      return `<div class="math-block">${html}</div>\n`
    }

    return defaultFence(tokens, idx, options, env, self)
  }
}

/**
 * Allow raw KaTeX HTML that we injected via placeholders through markdown-it html:false.
 * We inject using special markers that survive escape, then replace after render.
 * Simpler approach: enable a post-pass that already has HTML from fence handlers;
 * for inline we need html tokens — use placeholders.
 */
export const MATH_PLACEHOLDER_PREFIX = 'MATHPLACEHOLDER'

export function preprocessMathWithPlaceholders(
  source: string,
  config: MathFormatConfig
): { text: string; slots: string[] } {
  if (!config.enabled) return { text: source, slots: [] }

  const slots: string[] = []

  let result = source

  const fences: string[] = []
  result = result.replace(/```[\s\S]*?```/g, (match) => {
    const i = fences.length
    fences.push(match)
    return `\u0000FENCE${i}\u0000`
  })

  const inlines: string[] = []
  result = result.replace(/`[^`\n]+`/g, (match) => {
    const i = inlines.length
    inlines.push(match)
    return `\u0000INLINE${i}\u0000`
  })

  const pushSlot = (html: string): string => {
    const idx = slots.length
    slots.push(html)
    return `${MATH_PLACEHOLDER_PREFIX}${idx}X`
  }

  for (const [open, close] of config.blockDelimiters) {
    result = replaceDelimited(result, open, close, (tex) => {
      const html = `<div class="math-block">${renderKatex(tex.trim(), true, config.throwOnError)}</div>`
      return `\n\n${pushSlot(html)}\n\n`
    })
  }

  for (const [open, close] of config.inlineDelimiters) {
    result = replaceDelimited(result, open, close, (tex) => {
      const html = `<span class="math-inline">${renderKatex(tex.trim(), false, config.throwOnError)}</span>`
      return pushSlot(html)
    })
  }

  result = result.replace(/\u0000INLINE(\d+)\u0000/g, (_, i) => inlines[Number(i)])
  result = result.replace(/\u0000FENCE(\d+)\u0000/g, (_, i) => fences[Number(i)])

  return { text: result, slots }
}

export function restoreMathPlaceholders(html: string, slots: string[]): string {
  // Prefer replacing a wrapping <p> when the slot is a block-level math element
  let result = html.replace(
    new RegExp(`<p([^>]*)>\\s*${MATH_PLACEHOLDER_PREFIX}(\\d+)X\\s*</p>`, 'g'),
    (_whole, attrs: string, i: string) => {
      const slot = slots[Number(i)] ?? ''
      const line = /data-source-line="(\d+)"/.exec(attrs)?.[1]
      if (line && slot.startsWith('<') && !/\sdata-source-line=/.test(slot.slice(0, 120))) {
        return slot.replace(/^<[a-zA-Z][\w:-]*/, (tag) => `${tag} data-source-line="${line}"`)
      }
      return slot
    }
  )
  result = result.replace(new RegExp(`${MATH_PLACEHOLDER_PREFIX}(\\d+)X`, 'g'), (_, i) => {
    return slots[Number(i)] ?? ''
  })
  return result
}
