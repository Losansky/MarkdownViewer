import type { FindOptions, SearchHit } from './types'

export const SEARCH_MAX_HITS = 500

export interface TextRange {
  index: number
  length: number
}

export function findRanges(
  text: string,
  query: string,
  options?: Partial<FindOptions>
): TextRange[] | 'invalid-regex' {
  const q = query.trim()
  if (!q) return []

  if (options?.regex) {
    let pattern: RegExp
    try {
      pattern = new RegExp(q, options.caseSensitive ? 'g' : 'gi')
    } catch {
      return 'invalid-regex'
    }
    const ranges: TextRange[] = []
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text)) !== null) {
      ranges.push({ index: match.index, length: match[0].length })
      if (match[0].length === 0) pattern.lastIndex++
    }
    return ranges
  }

  const needle = options?.caseSensitive ? q : q.toLowerCase()
  const haystack = options?.caseSensitive ? text : text.toLowerCase()
  const ranges: TextRange[] = []
  let start = 0
  while (start < text.length) {
    const idx = haystack.indexOf(needle, start)
    if (idx === -1) break
    if (options?.wholeWord && !isWordBoundary(text, idx, idx + q.length)) {
      start = idx + 1
      continue
    }
    ranges.push({ index: idx, length: q.length })
    start = idx + q.length
  }
  return ranges
}

export function makeSnippet(line: string, index: number, length: number): string {
  const pad = 36
  const start = Math.max(0, index - pad)
  const end = Math.min(line.length, index + length + pad)
  let snippet = line.slice(start, end).replace(/\s+/g, ' ')
  if (start > 0) snippet = `…${snippet}`
  if (end < line.length) snippet = `${snippet}…`
  return snippet
}

export function collectTextHits(
  path: string,
  content: string,
  query: string,
  into: SearchHit[],
  options?: { caseSensitive?: boolean; wholeWord?: boolean; regex?: boolean }
): void {
  const q = query.trim()
  if (!q) return

  const lines = content.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const ranges = findRanges(line, q, options)
    if (ranges === 'invalid-regex') return
    for (const range of ranges) {
      into.push({
        path,
        line: i + 1,
        column: range.index + 1,
        length: range.length,
        snippet: makeSnippet(line, range.index, range.length)
      })
      if (into.length >= SEARCH_MAX_HITS) return
    }
  }
}

function isWordBoundary(line: string, start: number, end: number): boolean {
  const before = start > 0 ? line[start - 1] : ' '
  const after = end < line.length ? line[end] : ' '
  return !/\w/.test(before) && !/\w/.test(after)
}

export interface SearchDocument {
  path: string
  content: string
}

export function searchDocuments(
  docs: SearchDocument[],
  query: string,
  options?: { caseSensitive?: boolean; wholeWord?: boolean; regex?: boolean }
): SearchHit[] {
  const hits: SearchHit[] = []
  for (const doc of docs) {
    collectTextHits(doc.path, doc.content, query, hits, options)
    if (hits.length >= SEARCH_MAX_HITS) break
  }
  return hits
}
